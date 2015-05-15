'use strict'

var dcopy = require('deep-copy')


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
  if (provider.oauth == 1) {
    provider.key = options.consumer_key || provider.key
    provider.secret = options.consumer_secret || provider.secret
  }
  else if (provider.oauth == 2) {
    provider.key = options.client_id || provider.key
    provider.secret = options.client_secret || provider.secret
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

exports.init = function (config) {
  config = config||{}
  // oauth configuration
  var oauth = require('../config/oauth.json')
  // reserved keys
  var reserved = require('../config/reserved.json')
  // generated below
  var result = {}

  // custom providers
  var providers = Object.keys(oauth)
  Object.keys(config)
    .filter(function (key) {
      return providers.indexOf(key) == -1
    })
    .forEach(function (key) {
      oauth[key] = config[key]
    })

  // generate provider options
  for (var key in oauth) {
    // oauth provider settings
    var provider = dcopy(oauth[key])
    // oauth application options
    var options = config[key]||{}

    // provider shortcuts
    provider[key] = true
    provider.name = key

    //
    reserved.forEach(function (key) {
      provider[key] = options[key] || config.server[key] || provider[key]
    })

    // custom
    for (var key in options) {
      if (
        typeof options[key] === 'string' && reserved.indexOf(key) == -1 &&
        provider.custom_parameters && provider.custom_parameters.indexOf(key) != -1
      ) {
        provider[key] = options[key]
      }
    }

    // overrides
    var overrides = {}
    for (var key in options) {
      if (
        reserved.indexOf(key) == -1 &&
        key != 'scope' && typeof options[key] === 'object'
      ) {
        overrides[key] = this.dynamic(provider, options[key])
      }
    }
    this.transform(provider, options)
    provider.overrides = overrides

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
