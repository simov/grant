'use strict'

var dcopy = require('deep-copy')


// oauth scope transform
exports.scope = function (provider, options) {
  var scope = options.scope||provider.scope
  if (!scope) return

  provider.scope = (scope instanceof Array)
    ? scope.join(provider.scope_delimiter||',')
    : scope

  if (provider.linkedin) {
    // LinkedIn accepts an extended "scope" parameter when obtaining a request.
    // Unfortunately, it wants this as a URL query parameter, rather than encoded
    // in the POST body (which is the more established and supported mechanism of
    // extending OAuth).
    provider.request_url = provider.request_url.replace(/(.*)\?scope=.*/,'$1')
    provider.request_url += '?scope='+provider.scope
  }
}

exports.transform = function (provider, options) {
  this.scope(provider, options)
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
  // generated below
  var result = {}

  // generate provider options
  for (var key in oauth) {
    // oauth provider settings
    var provider = dcopy(oauth[key])
    // oauth application options
    var options = config[key]||{}

    // provider shortcuts
    provider[key] = true
    provider.name = key

    // application credentials
    provider.key = options.key
    provider.secret = options.secret

    // server options
    provider.protocol = options.protocol||config.server.protocol
    provider.host = options.host||config.server.host
    provider.callback = options.callback||config.server.callback
    provider.transport = options.transport||config.server.transport

    // oauth state
    provider.state = options.state||config.server.state

    // custom
    var reserved = ['protocol', 'host', 'callback', 'key', 'secret', 'scope', 'state']
    for (var key in options) {
      if (reserved.indexOf(key) == -1 && typeof options[key] !== 'object') {
        provider[key] = options[key]
      }
    }

    // overrides
    var overrides = {}
    for (var key in options) {
      if (key != 'scope' && typeof options[key] === 'object') {
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
