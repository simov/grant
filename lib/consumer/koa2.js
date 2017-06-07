'use strict'

var Koa = require('koa')
var util = require('util')

var qs = require('qs')

var config = require('../config')
var f = {
  1: require('../flow/oauth1'),
  2: require('../flow/oauth2'),
  3: require('../flow/getpocket')
}
var flows = {
  1: {step1: util.promisify(f[1].step1), step2: f[1].step2, step3: util.promisify(f[1].step3)},
  2: {step1: f[2].step1, step2: util.promisify(f[2].step2), step3: f[2].step3},
  getpocket: {step1: util.promisify(f[3].step1), step2: f[3].step2, step3: util.promisify(f[3].step3)}
}

// /:path*/connect/:provider/:override?
var regex = /^(?:\/([^\\/]+?(?:\/[^\\/]+?)*))?\/connect\/([^\\/]+?)(?:\/([^\\/]+?))?(?:\/(?=$))?$/i


module.exports = function Grant (_config) {
  var app = new Koa()
  app.config = config.init(_config)
  app._config = config

  app.use(async (ctx, next) => {
    var match = regex.exec(ctx.path)
    if (!match) {
      return next()
    }

    if (!ctx.session) {
      ctx.throw(400, 'Grant: mount session middleware first')
    }
    if (ctx.method === 'POST' && !ctx.request.body) {
      ctx.throw(400, 'Grant: mount body parser middleware first')
    }

    var provider = match[2]
    var override = match[3]

    if (ctx.method === 'GET') {
      if (override === 'callback') {
        return callback(ctx)
      }

      ctx.session.grant = {
        provider: provider
      }
      if (override) {
        ctx.session.grant.override = override
      }
      if (Object.keys(ctx.request.query || {}).length) {
        ctx.session.grant.dynamic = ctx.request.query
      }

      return connect(ctx)
    }

    else if (ctx.method === 'POST') {
      ctx.session.grant = {
        provider: provider
      }
      if (override) {
        ctx.session.grant.override = override
      }
      if (Object.keys(ctx.request.body || {}).length) {
        ctx.session.grant.dynamic = ctx.request.body
      }

      return connect(ctx)
    }
  })

  async function connect (ctx) {
    var grant = ctx.session.grant
    var provider = config.provider(app.config, grant)
    var flow = flows[provider.oauth]

    var callback = (err, url) => {
      var path = (provider.callback || '')
      if (err) {
        if (path) {
          ctx.response.redirect(path + '?' + err)
        }
        else {
          ctx.body = err
        }
      }
      else {
        ctx.response.redirect(url)
      }
    }

    if (/^1$/.test(provider.oauth)) {
      try {
        grant.step1 = await flow.step1(provider)
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
        grant.step1 = await flow.step1(provider)
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

  async function callback (ctx) {
    var grant = ctx.session.grant || {}
    var provider = config.provider(app.config, grant)
    var flow = flows[provider.oauth]

    var callback = (err, response) => {
      var path = (provider.callback || '')
      if (err) {
        if (path) {
          ctx.response.redirect(path + '?' + err)
        }
        else {
          ctx.body = err
        }
      }
      else if (!provider.transport || provider.transport === 'querystring') {
        ctx.response.redirect(path + '?' + response)
      }
      else if (provider.transport === 'session') {
        ctx.session.grant.response = qs.parse(response)
        ctx.response.redirect(path)
      }
    }

    if (/^1$/.test(provider.oauth)) {
      try {
        var response = await flow.step3(provider, grant.step1, ctx.query)
        callback(null, response)
      }
      catch (err) {
        callback(err)
      }
    }

    else if (/^2$/.test(provider.oauth)) {
      try {
        var data = await flow.step2(provider, ctx.query, grant)
        var response = flow.step3(provider, data)
        callback(null, response)
      }
      catch (err) {
        callback(err)
      }
    }

    else if (flow) {
      try {
        var response = await flow.step3(provider, grant.step1)
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
