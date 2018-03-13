'use strict'

var Koa = require('koa')
var thunkify = require('thunkify')

var qs = require('qs')

var config = require('../config')
var f = {
  1: require('../flow/oauth1'),
  2: require('../flow/oauth2'),
  3: require('../flow/getpocket')
}
var flows = {
  1: {step1: thunkify(f[1].step1), step2: f[1].step2, step3: thunkify(f[1].step3)},
  2: {step1: f[2].step1, step2: thunkify(f[2].step2), step3: f[2].step3},
  getpocket: {step1: thunkify(f[3].step1), step2: f[3].step2, step3: thunkify(f[3].step3)}
}

// /:path*/connect/:provider/:override?
var regex = /^(?:\/([^\\/]+?(?:\/[^\\/]+?)*))?\/connect\/([^\\/]+?)(?:\/([^\\/]+?))?(?:\/(?=$))?$/i


module.exports = function Grant (_config) {
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
        grant.step1 = yield flow.step1(provider)
        var url = flow.step2(provider, grant.step1)
        var err = !/^http|\//.test(url) ? url : null
        callback(err, url)
      }
      catch (err) {
        callback(err)
      }
    }

    else if (/^2$/.test(provider.oauth)) {
      grant.state = provider.state
      var url = flow.step1(provider)
      callback(null, url)
    }

    else if (flow) {
      try {
        grant.step1 = yield flow.step1(provider)
        var url = flow.step2(provider, grant.step1)
        callback(null, url)
      }
      catch (err) {
        callback(err)
      }
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
        var response = yield flow.step3(provider, grant.step1, this.query)
        callback(null, response)
      }
      catch (err) {
        callback(err)
      }
    }

    else if (/^2$/.test(provider.oauth)) {
      try {
        var data = yield flow.step2(provider, this.query, grant)
        var response = flow.step3(provider, data)
        callback(null, response)
      }
      catch (err) {
        callback(err)
      }
    }

    else if (flow) {
      try {
        var response = yield flow.step3(provider, grant.step1)
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
