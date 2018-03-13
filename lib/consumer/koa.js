'use strict'

var Koa = require('koa')
var thunkify = require('thunkify')
var qs = require('qs')

var config = require('../config')
var f = {
  1: require('../flow/oauth1'),
  2: require('../flow/oauth2')
}
var flows = {
  1: {request: thunkify(f[1].request), authorize: f[1].authorize, access: thunkify(f[1].access), callback: f[1].callback},
  2: {authorize: f[2].authorize, access: thunkify(f[2].access), callback: f[2].callback}
}

// /:path*/connect/:provider/:override?
var regex = /^(?:\/([^\\/]+?(?:\/[^\\/]+?)*))?\/connect\/([^\\/]+?)(?:\/([^\\/]+?))?(?:\/(?=$))?$/i


module.exports = function (_config) {
  var app = new Koa()
  app.config = config.init(_config)
  app._config = config

  app.use(function* (next) {
    var match = regex.exec(this.path)
    if (!match) {
      return yield next
    }

    if (!this.session) {
      throw new Error('Grant: mount session middleware first')
    }
    if (this.method === 'POST' && !this.request.body) {
      throw new Error('Grant: mount body parser middleware first')
    }

    var provider = match[2]
    var override = match[3]

    if (this.method === 'GET') {
      if (override === 'callback') {
        return yield callback
      }

      this.session.grant = {
        provider: provider
      }
      if (override) {
        this.session.grant.override = override
      }
      if (Object.keys(this.request.query || {}).length) {
        this.session.grant.dynamic = this.request.query
      }

      yield connect
    }

    else if (this.method === 'POST') {
      this.session.grant = {
        provider: provider
      }
      if (override) {
        this.session.grant.override = override
      }
      if (Object.keys(this.request.body || {}).length) {
        this.session.grant.dynamic = this.request.body
      }

      yield connect
    }
  })

  function* connect () {
    var grant = this.session.grant
    var provider = config.provider(app.config, grant)
    var flow = flows[provider.oauth]

    var transport = (data) => {
      if (!provider.transport || provider.transport === 'querystring') {
        this.response.redirect((provider.callback || '') + '?' + data)
      }
      else if (provider.transport === 'session') {
        this.session.grant.response = qs.parse(data)
        this.response.redirect(provider.callback || '')
      }
    }

    var callback = (err, url) => {
      if (err) {
        provider.callback ? transport(err) : (this.body = err)
      }
      else {
        this.response.redirect(url)
      }
    }

    if (/^1$/.test(provider.oauth)) {
      try {
        grant.request = yield flow.request(provider)
        var url = flow.authorize(provider, grant.request)
        var err = !/^http|\//.test(url) ? url : null
        callback(err, url)
      }
      catch (err) {
        callback(err)
      }
    }

    else if (/^2$/.test(provider.oauth)) {
      grant.state = provider.state
      var url = flow.authorize(provider)
      callback(null, url)
    }

    else {
      var error = {error: 'Grant: missing or misconfigured provider'}
      callback(qs.stringify(error))
    }
  }

  function* callback () {
    var grant = this.session.grant || {}
    var provider = config.provider(app.config, grant)
    var flow = flows[provider.oauth]

    var transport = (data) => {
      if (!provider.transport || provider.transport === 'querystring') {
        this.response.redirect((provider.callback || '') + '?' + data)
      }
      else if (provider.transport === 'session') {
        this.session.grant.response = qs.parse(data)
        this.response.redirect(provider.callback || '')
      }
    }

    var callback = (err, data) => {
      if (err) {
        provider.callback ? transport(err) : (this.body = err)
      }
      else {
        transport(data)
      }
    }

    if (/^1$/.test(provider.oauth)) {
      try {
        var data = yield flow.access(provider, grant.request, this.query)
        var response = flow.callback(provider, data)
        callback(null, response)
      }
      catch (err) {
        callback(err)
      }
    }

    else if (/^2$/.test(provider.oauth)) {
      try {
        var data = yield flow.access(provider, this.query, grant)
        var response = flow.callback(provider, data)
        callback(null, response)
      }
      catch (err) {
        callback(err)
      }
    }

    else {
      var err = {error: 'Grant: missing session or misconfigured provider'}
      callback(qs.stringify(err))
    }
  }

  return app
}
