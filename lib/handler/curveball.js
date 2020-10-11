
var qs = require('qs')
var Grant = require('../grant')


module.exports = function (args = {}) {
  var grant = Grant(args.config ? args : {config: args})
  app.config = grant.config

  var regex = new RegExp([
    '^',
    app.config.defaults.prefix,
    /(?:\/([^\/\?]+?))/.source, // /:provider
    /(?:\/([^\/\?]+?))?/.source, // /:override?
    /(?:\/$|\/?\?+.*)?$/.source, // querystring
  ].join(''), 'i')

  async function app (ctx, next) {
    var match = regex.exec(ctx.path)
    if (!match) {
      return next()
    }

    if (!ctx.state.session) {
      throw new Error('Grant: mount session middleware first')
    }
    if (ctx.method === 'POST' && !ctx.request.body) {
      throw new Error('Grant: mount body parser middleware first')
    }

    var {location, session, state} = await grant({
      method: ctx.method,
      params: {provider: match[1], override: match[2]},
      query: qs.parse(ctx.request.query),
      body: qs.parse(ctx.request.body),
      state: ctx.state.grant,
      session: ctx.state.session.grant,
    })

    ctx.state.session.grant = session
    ctx.state.grant = state
    location ? ctx.response.redirect(302, location) : await next()
  }

  return app
}
