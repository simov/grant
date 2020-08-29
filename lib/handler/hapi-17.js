
var qs = require('qs')
var Grant = require('../grant')


module.exports = function (args = {}) {
  var app = {}

  function register (server, options) {
    args = args.config ? args : {config: args}
    args.config = Object.keys(options).length ? options : args.config

    var grant = Grant(args)
    app.config = grant.config

    var prefix = app.config.defaults.prefix
      .replace(server.realm.modifiers.route.prefix, '')

    server.route({
      method: ['GET', 'POST'],
      path: `${prefix}/{provider}/{override?}`,
      handler: async (req, res) => {
        if (!req.yar) {
          throw new Error('Grant: register session plugin first')
        }

        var {location, session, state} = await grant({
          method: req.method,
          params: req.params,
          query: qs.parse(req.query),
          body: qs.parse(req.payload), // #2985
          state: req.plugins.grant,
          session: req.yar.get('grant'),
        })

        req.yar.set('grant', session)
        req.plugins.grant = state
        return location ? res.redirect(location) : res.continue
      }
    })
  }

  app.pkg = require('../../package.json')

  app.register = register
  return app
}
