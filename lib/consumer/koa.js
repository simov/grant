'use strict'

var koa = require('koa')
var route = require('koa-route')
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


function Grant (_config) {
  var app = new koa()
  app.config = config.init(_config)
  app._config = config

  app.use(route.all('/connect/:provider/:override?', function* (provider, override, next) {
    if (!this.session) {
      throw new Error('Grant: mount session middleware first')
    }
    if (this.method === 'POST' && !this.request.body) {
      throw new Error('Grant: mount body parser middleware first')
    }

    yield next
  }))

  app.use(route.get('/connect/:provider/:override?', function* (provider, override) {
    if (override === 'callback') {
      yield callback
      return
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
  }))

  app.use(route.post('/connect/:provider/:override?', function* (provider, override) {
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
  }))

  function* connect () {
    var grant = this.session.grant
    var provider = config.provider(app.config, grant)
    var flow = flows[provider.oauth]

    var callback = function (err, url) {
      var path = (provider.callback || '')
      if (err) {
        if (path) {
          this.response.redirect(path + '?' + err)
        }
        else {
          this.body = err
        }
      }
      else {
        this.response.redirect(url)
      }
    }.bind(this)

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

    var callback = function (err, response) {
      var path = (provider.callback || '')
      if (err) {
        if (path) {
          this.response.redirect(path + '?' + err)
        }
        else {
          this.body = err
        }
      }
      else if (!provider.transport || provider.transport === 'querystring') {
        this.response.redirect(path + '?' + response)
      }
      else if (provider.transport === 'session') {
        this.session.grant.response = qs.parse(response)
        this.response.redirect(path)
      }
    }.bind(this)

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

exports = module.exports = Grant
