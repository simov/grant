
var _consumer = require('../consumer')


module.exports = function (config) {
  var consumer = _consumer({config})
  app.config = consumer.config

  var regex = new RegExp([
    '^',
    app.config.defaults.prefix.replace(/\//g, '\/'),
    /\/([^\\/]+?)/.source, // /:provider
    /(?:\/([^\\/]+?))?/.source, // /:override?
    /\/?(?:\?([^/]+))?$/.source, // querystring
  ].join(''))

  async function app (ctx, next) {
    var match = regex.exec(ctx.originalUrl)
    if (!match) {
      return next()
    }

    if (!ctx.session) {
      ctx.throw(400, 'Grant: mount session middleware first')
    }
    if (ctx.method === 'POST' && !ctx.request.body) {
      ctx.throw(400, 'Grant: mount body parser middleware first')
    }

    var params = {
      provider: match[1],
      override: match[2]
    }

    var {error, url, session, state} = await consumer({
      method: ctx.method,
      params,
      query: ctx.request.query,
      body: ctx.request.body,
      state: ctx.state.grant,
      session: ctx.session.grant,
    })

    ctx.session.grant = session
    ctx.state.grant = state
    error ? (ctx.body = error) : url ? ctx.response.redirect(url) : await next()
  }

  return app
}
