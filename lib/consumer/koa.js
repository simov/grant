'use strict'

var koa = require('koa')
  , route = require('koa-route')
  , thunkify = require('thunkify')

var qs = require('qs')

var config = require('../config')
var f = {
  1: require('../flow/oauth1'),
  2: require('../flow/oauth2'),
  3: require('../flow/getpocket')
}
var flows = {
  1:{step1:thunkify(f[1].step1), step2:f[1].step2, step3:thunkify(f[1].step3)},
  2:{step1:f[2].step1, step2:thunkify(f[2].step2), step3:f[2].step3},
  getpocket:{step1:thunkify(f[3].step1), step2:f[3].step2, step3:thunkify(f[3].step3)}
}


function Grant (_config) {
  var app = koa()
  app.config = config.init(_config)
  app._config = config

  app.use(route.all('/connect/:provider/:override?', function *(provider, override, next) {
    if (!this.session)
      throw new Error('Grant: mount session middleware first')
    if (this.method == 'POST' && !this.request.body)
      throw new Error('Grant: mount body parser middleware first')
    yield next
  }))

  app.use(route.get('/connect/:provider/:override?', function *(provider, override) {
    if (override == 'callback') return yield callback

    this.session.grant = {
      provider:provider
    }
    if (override) {
      this.session.grant.override = override
    }
    if (Object.keys(this.request.query||{}).length) {
      this.session.grant.dynamic = this.request.query
    }

    yield connect
  }))

  app.use(route.post('/connect/:provider/:override?', function *(provider, override) {
    this.session.grant = {
      provider:provider
    }
    if (override) {
      this.session.grant.override = override
    }
    if (Object.keys(this.request.body||{}).length) {
      this.session.grant.dynamic = this.request.body
    }

    yield connect
  }))

  function* connect () {
    var grant = this.session.grant
    var provider = config.provider(app.config, grant)
    var flow = flows[provider.oauth]


    if (provider.oauth == 1) {
      var data
      try {
        data = yield flow.step1(provider)
      } catch (err) {
        return this.response.redirect(provider.callback + '?' + err)
      }
      grant.step1 = data
      var url = flow.step2(provider, data)
      this.response.redirect(url)
    }

    else if (provider.oauth == 2) {
      grant.state = provider.state
      var url = flow.step1(provider)
      this.response.redirect(url)
    }

    else if (flow) {
      try {
        var data = yield flow.step1(provider)
      } catch (err) {
        return this.response.redirect(provider.callback + '?' + err)
      }
      grant.step1 = data
      var url = flow.step2(provider, data)
      this.response.redirect(url)
    }

    else {
      var err = {error:'Grant: missing or misconfigured provider'}
      if (provider.callback) {
        this.response.redirect(provider.callback + '?' + qs.stringify(err))
      } else {
        this.body = JSON.stringify(err)
      }
    }
  }

  function* callback () {
    var grant = this.session.grant || {}
    var provider = config.provider(app.config, grant)
    var flow = flows[provider.oauth]

    var callback = function (response) {
      if (!provider.transport || provider.transport == 'querystring') {
        this.response.redirect(provider.callback + '?' + response)
      }
      else if (provider.transport == 'session') {
        this.session.grant.response = qs.parse(response)
        this.response.redirect(provider.callback)
      }
    }.bind(this)

    if (provider.oauth == 1) {
      try {
        var response = yield flow.step3(provider, grant.step1, this.query)
      } catch (err) {
        return this.response.redirect(provider.callback + '?' + err)
      }
      callback(response)
    }

    else if (provider.oauth == 2) {
      try {
        var data = yield flow.step2(provider, this.query, grant)
      } catch (err) {
        return this.response.redirect(provider.callback + '?' + err)
      }
      var response = flow.step3(provider, data)
      callback(response)
    }

    else if (flow) {
      try {
        var response = yield flow.step3(provider, grant.step1)
      } catch (err) {
        return this.reponse.redirect(provider.callback + '?' + err)
      }
      callback(response)
    }

    else {
      var err = {error:'Grant: missing session or misconfigured provider'}
      if (provider.callback) {
        this.response.redirect(provider.callback + '?' + qs.stringify(err))
      } else {
        this.body = JSON.stringify(err)
      }
    }
  }

  return app
}

exports = module.exports = Grant
