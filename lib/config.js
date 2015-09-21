'use strict'

var crypto = require('crypto')
var dcopy = require('deep-copy')

// oauth configuration
exports.oauth = require('../config/oauth.json')
// reserved keys
exports.reserved = require('../config/reserved.json')


// generate provider options
exports.initProvider = function (provider, options, server, name) {

  // merge provider options with user options


  // cleanup empty values in custom_params
  if (options.custom_params) {
    var params = options.custom_params
    for (var key in params) {
      if (!params[key]) delete params[key]
    }
    if (!Object.keys(params).length) {
      delete options.custom_params
    }
  }

  // set reserved keys
  this.reserved.forEach(function (key) {
    var value = options[key] || server[key] || provider[key]
    if (value) {
      provider[key] = value
    }
  })


  // transformations


  // provider shortcuts
  if (name) {
    provider[name] = true
    provider.name = name
  }


  // oauth credentials
  var key = null, secret = null
  if (provider.oauth == 1) {
    key = provider.consumer_key || provider.key
    secret = provider.consumer_secret || provider.secret
  }
  else if (provider.oauth == 2) {
    key = provider.client_id || provider.key
    secret = provider.client_secret || provider.secret
  }
  if (key) {
    provider.key = key
  }
  if (secret) {
    provider.secret = secret
  }


  // oauth scope
  if (provider.scope) {
    if (provider.scope instanceof Array) {
      provider.scope = provider.scope.join(provider.scope_delimiter||',')
    }
    else if (typeof provider.scope == 'object') {
      provider.scope = JSON.stringify(provider.scope)
    }
  }


  // custom_parameters
  if (provider.custom_parameters) {
    var params = provider.custom_params || {}
    for (var key in options) {
      if (this.reserved.indexOf(key) == -1 &&
          provider.custom_parameters.indexOf(key) != -1) {

        params[key] = options[key]
      }
    }
    if (Object.keys(params).length) {
      provider.custom_params = params
    }
  }


  // static overrides
  var overrides = {}
  for (var key in options) {
    if (provider.custom_parameters &&
        provider.custom_parameters.indexOf(key) != -1) continue

    if (this.reserved.indexOf(key) == -1 &&
        typeof options[key] === 'object') {

      overrides[key] = this.initProvider(dcopy(provider), options[key], {})
    }
  }
  if (Object.keys(overrides).length) {
    provider.overrides = overrides
  }


  return provider
}

// initialize all configured providers
exports.init = function (config) {
  config = config || {}
  var server = config.server || {}

  // generate provider options
  var result = {}
  for (var key in config) {
    if (key == 'server') continue
    var provider = dcopy(this.oauth[key]||{})
      , options = config[key]||{}

    var generated = this.initProvider(provider, options, server, key)
    result[generated.name] = generated
  }

  result.server = server
  return result
}

// oauth state transform
exports.state = function (provider) {
  var state
  if (typeof provider.state == 'string' || typeof provider.state == 'number') {
    state = provider.state.toString()
  }
  else if (typeof provider.state == 'boolean' && provider.state) {
    state = crypto.randomBytes(10).toString('hex')
  }
  return state
}

// get provider on connect
exports.provider = function (config, session) {
  var name = session.provider
    , provider = config[name]

  if (!provider) {
    if (this.oauth[name]) {
      var provider = dcopy(this.oauth[name])
        , options = {}
        , server = config.server || {}
      provider = this.initProvider(provider, options, server, name)

      config[provider.name] = provider
    } else {
      provider = {}
    }
  }

  if (session.override && provider.overrides) {
    var override = provider.overrides[session.override]
    if (override) provider = override
  }

  if (session.dynamic) {
    var provider = dcopy(provider)
      , options = session.dynamic
      , server = config.server || {}
    provider = this.initProvider(provider, options, server)
  }

  if (provider.state) {
    provider = dcopy(provider)
    provider.state = this.state(provider)
  }

  return provider
}
