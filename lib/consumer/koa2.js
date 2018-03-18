
var Koa = require('koa')
var qs = require('qs')

var config = require('../config')
var flows = {
  1: require('../flow/oauth1'),
  2: require('../flow/oauth2'),
  response: require('../response')
}

// /:path*/connect/:provider/:override?
var regex = /^(?:\/([^\\/]+?(?:\/[^\\/]+?)*))?\/connect\/([^\\/]+?)(?:\/([^\\/]+?))?(?:\/(?=$))?$/i


module.exports = function (_config) {
  var app = new Koa()
  app.config = config.init(_config)

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

    var transport = (data) => {
      if (!provider.callback) {
        ctx.body = qs.stringify(data)
      }
      else if (!provider.transport || provider.transport === 'querystring') {
        ctx.response.redirect((provider.callback || '') + '?' + qs.stringify(data))
      }
      else if (provider.transport === 'session') {
        ctx.session.grant.response = data
        ctx.response.redirect(provider.callback || '')
      }
    }
    var success = (url) => ctx.response.redirect(url)
    var error = (err) => transport({error: err.body})

    if (/^1$/.test(provider.oauth)) {
      try {
        var {body} = await flow.request(provider)
        grant.request = body
        var url = await flow.authorize(provider, body)
        success(url)
      }
      catch (err) {
        error(err)
      }
    }

    else if (/^2$/.test(provider.oauth)) {
      try {
        grant.state = provider.state
        var url = await flow.authorize(provider)
        success(url)
      }
      catch (err) {
        error(err)
      }
    }

    else {
      error({body: 'Grant: missing or misconfigured provider'})
    }
  }

  async function callback (ctx) {
    var grant = ctx.session.grant || {}
    var provider = config.provider(app.config, grant)
    var flow = flows[provider.oauth]

    var transport = (data) => {
      if (!provider.callback) {
        ctx.body = qs.stringify(data)
      }
      else if (!provider.transport || provider.transport === 'querystring') {
        ctx.response.redirect((provider.callback || '') + '?' + qs.stringify(data))
      }
      else if (provider.transport === 'session') {
        ctx.session.grant.response = data
        ctx.response.redirect(provider.callback || '')
      }
    }
    var success = (data) => transport(data)
    var error = (err) => transport({error: err.body})

    if (/^1$/.test(provider.oauth)) {
      try {
        var {body} = await flow.access(provider, grant.request, ctx.query)
        success(flows.response(provider, body))
      }
      catch (err) {
        error(err)
      }
    }

    else if (/^2$/.test(provider.oauth)) {
      try {
        var {body} = await flow.access(provider, ctx.query, grant)
        success(flows.response(provider, body))
      }
      catch (err) {
        error(err)
      }
    }

    else {
      error({body: 'Grant: missing session or misconfigured provider'})
    }
  }

  return app
}
