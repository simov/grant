
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
      var state = ctx.session.grant = ctx.session.grant || {}
      var {url, error} = await consumer.callback({state, query: ctx.request.query}) // mutates state
      error ? (ctx.body = error) : ctx.response.redirect(url)
    }

    // connect
    else {
      var state = ctx.session.grant = {}
      state.provider = provider

      if (override) {
        state.override = override
      }
      if (ctx.method === 'GET' && Object.keys(ctx.request.query || {}).length) {
        state.dynamic = ctx.request.query
      }
      else if (ctx.method === 'POST' && Object.keys(ctx.request.body || {}).length) {
        state.dynamic = ctx.request.body
      }

      var {url, error} = await consumer.connect({state}) // mutates state
      error ? (ctx.body = error) : ctx.response.redirect(url)
    }
  }

  return app
}
