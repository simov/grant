
var crypto = require('crypto')
var dcopy = require('deep-copy')

// oauth configuration
var oauth = require('../config/oauth.json')
// reserved keys
var reserved = require('../config/reserved.json')


// merge provider options with user options and server defaults
var merge = ({provider, options = {}, defaults = {}, name}) => {
  provider = dcopy(provider)
  options = dcopy(options)
  defaults = dcopy(defaults)

  // cleanup empty values in custom_params
  ;(() => {
    if (options.custom_params) {
      var params = options.custom_params
      for (var key in params) {
        if (!params[key]) {
          delete params[key]
        }
      }
      if (!Object.keys(params).length) {
        delete options.custom_params
      }
    }
  })()

  // set reserved keys
  ;(() => {
    for (var key of reserved) {
      var value = options[key] || defaults[key] || provider[key]
      if (value) {
        provider[key] = value
      }
    }
  })()

  // provider name
  if (name) {
    provider[name] = true
    provider.name = name
  }

  // oauth credentials
  ;(() => {
    var key, secret
    if (provider.oauth === 1) {
      key = provider.consumer_key || provider.key
      secret = provider.consumer_secret || provider.secret
    }
    else if (provider.oauth === 2) {
      key = provider.client_id || provider.key
      secret = provider.client_secret || provider.secret
    }
    if (key) {
      provider.key = key
    }
    if (secret) {
      provider.secret = secret
    }
  })()

  // oauth scope
  if (provider.scope) {
    if (provider.scope instanceof Array) {
      provider.scope = provider.scope.join(provider.scope_delimiter || ',')
    }
    else if (typeof provider.scope === 'object') {
      provider.scope = JSON.stringify(provider.scope)
    }
  }

  // redirect_uri
  if (!provider.redirect_uri && provider.protocol && provider.host && provider.name) {
    provider.redirect_uri = [
      provider.protocol,
      '://',
      provider.host,
      provider.path,
      '/connect/',
      provider.name,
      '/callback'
    ].join('')
  }

  // custom_parameters
  ;(() => {
    if (provider.custom_parameters) {
      var params = provider.custom_params || {}
      for (var key in options) {
        if (!reserved.includes(key) &&
            provider.custom_parameters.includes(key)) {

          params[key] = options[key]
        }
      }
      if (Object.keys(params).length) {
        provider.custom_params = params
      }
    }
  })()

  // static overrides
  ;(() => {
    var overrides = {}
    for (var key in options) {
      if (
        reserved.includes(key) ||
        (provider.custom_parameters || []).includes(key)) {
        continue
      }

      if (typeof options[key] === 'object') {
        overrides[key] = merge({
          provider,
          options: options[key],
        })
      }
    }
    if (Object.keys(overrides).length) {
      provider.overrides = overrides
    }
  })()

  return provider
}

// initialize all configured providers
var init = (config = {}) => {
  var defaults = config.defaults || config.server
  var providers = {}
  for (var name in config) {
    if (/defaults|server/.test(name)) {
      continue
    }
    providers[name] = merge({
      provider: oauth[name],
      options: config[name],
      defaults,
      name,
    })
  }
  if (defaults) {
    providers.defaults = defaults
  }
  return providers
}

// oauth state/nonce transform
var state = (provider, param = 'state') => {
  var state
  if (/string|number/.test(typeof provider[param])) {
    state = provider[param].toString()
  }
  else if (provider[param] === true) {
    state = crypto.randomBytes(10).toString('hex')
  }
  return state
}

// get provider on connect
var provider = (config, session) => {
  var name = session.provider
  var provider = config[name]

  var allow = (config.defaults || {}).dynamic === true

  if (!provider) {
    if (!allow) {
      return {}
    }
    if (oauth[name]) {
      provider = merge({
        provider: oauth[name],
        defaults: config.defaults,
        name,
      })
    }
    else {
      provider = {}
    }
  }

  if (session.override && provider.overrides) {
    var override = provider.overrides[session.override]
    if (override) {
      provider = override
    }
  }

  if (session.dynamic && allow) {
    provider = merge({
      provider,
      options: session.dynamic,
      defaults: config.defaults,
    })
  }

  if (provider.state) {
    provider = dcopy(provider)
    provider.state = state(provider)
  }
  if (provider.nonce) {
    provider = dcopy(provider)
    provider.nonce = state(provider, 'nonce')
  }

  return provider
}

module.exports = {merge, init, state, provider}
