
var qs = require('qs')
var Grant = require('../grant')


module.exports = function (args = {}) {

  function app (server, options, next) {
    args = args.config ? args : {config: args}

    var grant = Grant(args)
    app.config = grant.config

    var prefix = app.config.defaults.prefix.replace(options.prefix, '')

    server.route({
      method: ['GET', 'POST'],
      path: `${prefix}/:provider`,
      handler
    })
    server.route({
      method: ['GET', 'POST'],
      path: `${prefix}/:provider/:override`,
      handler
    })

    async function handler (req, res) {
      if (!req.session) {
        throw new Error('Grant: register session plugin first')
      }

      var {location, session, state} = await grant({
        method: req.method,
        params: req.params,
        query: qs.parse(req.query),
        body: qs.parse(req.body),
        state: req.grant,
        session: req.session.grant,
      })

      req.session.grant = session
      res.grant = state
      return location ? res.redirect(location) : res.send()
    }

    next()
  }

  return app
}
