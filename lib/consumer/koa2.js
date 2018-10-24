
var Koa = require('koa')
var qs = require('qs')

var config = require('../config')
var oauth1 = require('../flow/oauth1')
var oauth2 = require('../flow/oauth2')

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
    var session = ctx.session.grant
    var provider = config.provider(app.config, session)

    var transport = (data) => {
      if (!provider.callback) {
        ctx.body = qs.stringify(data)
      }
      else if (!provider.transport || provider.transport === 'querystring') {
        ctx.response.redirect(`${provider.callback}?${qs.stringify(data)}`)
      }
      else if (provider.transport === 'session') {
        session.response = data
        ctx.response.redirect(provider.callback)
      }
    }

    if (/^1$/.test(provider.oauth)) {
      try {
        var {body} = await oauth1.request(provider)
        session.request = body
        var url = await oauth1.authorize(provider, body)
        ctx.response.redirect(url)
      }
      catch (err) {
        transport(err)
      }
    }

    else if (/^2$/.test(provider.oauth)) {
      try {
        session.state = provider.state
        var url = await oauth2.authorize(provider)
        ctx.response.redirect(url)
      }
      catch (err) {
        transport(err)
      }
    }

    else {
      transport({error: 'Grant: missing or misconfigured provider'})
    }
  }

  async function callback (ctx) {
    var session = ctx.session.grant
    var provider = config.provider(app.config, session)

    var transport = (data) => {
      if (!provider.callback) {
        ctx.body = qs.stringify(data)
      }
      else if (!provider.transport || provider.transport === 'querystring') {
        ctx.response.redirect(`${provider.callback}?${qs.stringify(data)}`)
      }
      else if (provider.transport === 'session') {
        session.response = data
        ctx.response.redirect(provider.callback)
      }
    }

    if (/^1$/.test(provider.oauth)) {
      try {
        var data = await oauth1.access(provider, session.request, ctx.query)
        transport(data)
      }
      catch (err) {
        transport(err)
      }
    }

    else if (/^2$/.test(provider.oauth)) {
      try {
        var data = await oauth2.access(provider, ctx.query, session)
        transport(data)
      }
      catch (err) {
        transport(err)
      }
    }

    else {
      transport({error: 'Grant: missing session or misconfigured provider'})
    }
  }

  return app
}
