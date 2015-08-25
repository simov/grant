'use strict'

var crypto = require('crypto')
var dcopy = require('deep-copy')

// oauth configuration
exports.oauth = require('../config/oauth.json')
// reserved keys
exports.reserved = require('../config/reserved.json')


// oauth credentials transform
exports.credentials = function (provider, options) {
  var key, secret
  if (provider.oauth == 1) {
    key = options.consumer_key || provider.key
    secret = options.consumer_secret || provider.secret
  }
  else if (provider.oauth == 2) {
    key = options.client_id || provider.key
    secret = options.client_secret || provider.secret
  }
  if (key) {
    provider.key = key
  }
  if (secret) {
    provider.secret = secret
  }
}

// oauth scope transform
exports.scope = function (provider, options) {
  var scope = options.scope || provider.scope
  if (!scope) return

  provider.scope = (scope instanceof Array)
    ? scope.join(provider.scope_delimiter||',')
    : scope

  if (provider.copy && typeof scope === 'object') {
    provider.scope = JSON.stringify(scope)
  }
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

// custom_parameters transform
exports.custom_params = function (provider, options) {
  var params = options.custom_params || provider.custom_params || {}
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

// override provider
exports.override = function (provider, options) {
  var override = dcopy(provider)
  for (var key in options) {
    if (!options[key]) continue
    override[key] = options[key]
  }
  this.custom_params(override, options)
  this.transform(override, options)
  return override
}

// apply multiple transformations
exports.transform = function (provider, options) {
  this.credentials(provider, options)
  this.scope(provider, options)
}

// generate provider options
exports.initProvider = function (key, config) {
  // oauth provider settings
  var provider = dcopy(this.oauth[key]||{})
  // oauth application options
  var options = config[key]||{}

  // provider shortcuts
  provider[key] = true
  provider.name = key

  // set reserved keys
  this.reserved.forEach(function (key) {
    var value = options[key] || config.server[key] || provider[key]
    if (value) {
      provider[key] = value
    }
  })

  // custom parameters
  if (provider.custom_parameters || provider.custom_params) {
    this.custom_params(provider, options)
  }

  // static overrides
  var overrides = {}
  for (var key in options) {
    if (this.reserved.indexOf(key) == -1 &&
        key != 'scope' &&
        typeof options[key] === 'object') {

      overrides[key] = this.override(provider, options[key])
    }
  }
  if (Object.keys(overrides).length) {
    provider.overrides = overrides
  }

  this.transform(provider, options)
  return provider
}

// initialize all configured providers
exports.init = function (config) {
  config = config || {}
  config.server = config.server || {}

  // generate provider options
  var result = {}
  for (var key in config) {
    if (key == 'server') continue
    var provider = this.initProvider(key, config)
    result[provider.name] = provider
  }

  result.server = config.server
  return result
}

// get provider on connect
exports.provider = function (config, session) {
  var provider = config[session.provider]
  if (!provider) {
    provider = this.initProvider(session.provider, config)
    config[provider.name] = provider
  }
  if (session.override && provider.overrides) {
    var override = provider.overrides[session.override]
    if (override) provider = override
  }
  if (session.dynamic) {
    provider = this.override(provider, session.dynamic)
  }
  if (provider.state) {
    provider = dcopy(provider)
    provider.state = this.state(provider)
  }
  return provider
}
