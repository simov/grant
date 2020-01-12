
var _consumer = require('../consumer')

// /:path*/connect/:provider/:override?
var regex = /^(?:\/([^\\/]+?(?:\/[^\\/]+?)*))?\/connect\/([^\\/]+?)(?:\/([^\\/]+?))?(?:\/(?=$))?$/i


module.exports = function (config) {
  var consumer = _consumer({config})
  app.config = consumer.config

  async function app (ctx, next) {
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

    // callback
    if (ctx.method === 'GET' && override === 'callback') {
      var session = ctx.session.grant = ctx.session.grant || {}
      var query = ctx.request.query
      var state = ctx.state.grant = ctx.state.grant || {}

      var {url, error} = await consumer.callback({session, query, state}) // mutates session/state
      error ? (ctx.body = error) : url ? ctx.response.redirect(url) : await next()
    }

    // connect
    else {
      var session = ctx.session.grant = {}
      session.provider = provider

      if (override) {
        session.override = override
      }
      if (ctx.method === 'GET' && Object.keys(ctx.request.query || {}).length) {
        session.dynamic = ctx.request.query
      }
      else if (ctx.method === 'POST' && Object.keys(ctx.request.body || {}).length) {
        session.dynamic = ctx.request.body
      }

      var state = ctx.state.grant

      var {url, error} = await consumer.connect({session, state}) // mutates session
      error ? (ctx.body = error) : ctx.response.redirect(url)
    }
  }

  return app
}
