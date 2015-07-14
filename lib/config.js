'use strict'

var dcopy = require('deep-copy')

// oauth configuration
exports.oauth = require('../config/oauth.json')
// reserved keys
exports.reserved = require('../config/reserved.json')


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

exports.transform = function (provider, options) {
  this.scope(provider, options)
  this.credentials(provider, options)
}

exports.override = function (provider, options) {
  var override = dcopy(provider)
  for (var key in options) {
    if (!options[key]) continue
    override[key] = options[key]
  }
  return override
}

exports.dynamic = function (provider, options) {
  var override = this.override(provider, options)
  this.transform(override, options)
  return override
}

exports.state = function (provider) {
  var state
  if (typeof provider.state == 'string' || typeof provider.state == 'number') {
    state = provider.state.toString()
  }
  else if (typeof provider.state == 'boolean' && provider.state) {
    state = (Math.floor(Math.random() * 999999) + 1).toString()
  }
  return state
}

// generate provider options
exports.initProvider = function (key, config) {
  // oauth provider settings
  var provider = dcopy(this.oauth[key])
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
  for (var key in options) {
    if (
      typeof options[key] === 'string' && this.reserved.indexOf(key) == -1 &&
      provider.custom_parameters && provider.custom_parameters.indexOf(key) != -1
    ) {
      provider[key] = options[key]
    }
  }

  // static overrides
  var overrides = {}
  for (var key in options) {
    if (
      this.reserved.indexOf(key) == -1 &&
      key != 'scope' && typeof options[key] === 'object'
    ) {
      overrides[key] = this.dynamic(provider, options[key])
    }
  }
  this.transform(provider, options)
  if (Object.keys(overrides).length) {
    provider.overrides = overrides
  }

  return provider
}

exports.init = function (config) {
  config = config||{}
  // generated below
  var result = {}

  // custom providers
  var providers = Object.keys(this.oauth)
  Object.keys(config)
    .filter(function (key) {
      return providers.indexOf(key) == -1
    })
    .forEach(function (key) {
      this.oauth[key] = config[key]
    }.bind(this))

  // generate provider options
  for (var key in this.oauth) {
    var provider = this.initProvider(key, config)
    result[provider.name] = provider
  }

  return result
}

exports.provider = function (config, session) {
  var provider = config[session.provider]
  if (session.override && provider.overrides) {
    var override = provider.overrides[session.override]
    if (override) provider = override
  }
  if (session.dynamic) {
    provider = this.dynamic(provider, session.dynamic)
  }
  if (provider.state) {
    provider = dcopy(provider)
    provider.state = this.state(provider)
  }
  return provider
}
