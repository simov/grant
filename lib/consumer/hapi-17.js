
var qs = require('qs')

var _consumer = require('../grant')


module.exports = function (config) {
  var app = {}

  function register (server, options) {
    var consumer = _consumer({
      config: Object.keys(options).length ? options : config
    })
    app.config = consumer.config

    var prefix = app.config.defaults.prefix
      .replace(server.realm.modifiers.route.prefix, '')

    server.route({
      method: ['GET', 'POST'],
      path: `${prefix}/{provider}/{override?}`,
      handler: async (req, res) => {
        if (!(req.session || req.yar)) {
          throw new Error('Grant: register session plugin first')
        }

        var {location, session, state} = await consumer({
          method: req.method,
          params: req.params,
          query: qs.parse(req.query),
          body: qs.parse(req.payload), // #2985
          state: req.plugins.grant,
          session: (req.session || req.yar).get('grant'),
        })

        ;(req.session || req.yar).set('grant', session)
        req.plugins.grant = state
        return location ? res.redirect(location) : res.continue
      }
    })

    server.route({
      method: 'GET',
      path: `${prefix}/{provider}/callback`,
      handler: async (req, res) => {
        var params = {
          provider: req.params.provider,
          override: 'callback'
        }

        var {location, session, state} = await consumer({
          method: req.method,
          params,
          query: qs.parse(req.query),
          body: qs.parse(req.payload), // #2985
          state: req.plugins.grant,
          session: (req.session || req.yar).get('grant'),
        })

        ;(req.session || req.yar).set('grant', session)
        req.plugins.grant = state
        return location ? res.redirect(location) : res.continue
      }
    })
  }

  app.pkg = require('../../package.json')

  app.register = register
  return app
}
