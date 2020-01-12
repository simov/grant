
var qs = require('qs')

var _consumer = require('../consumer')


module.exports = function (config) {
  var app = {}

  function register (server, options) {
    var consumer = _consumer({
      config: Object.keys(options).length ? options : config
    })
    app.config = consumer.config

    server.route({
      method: ['GET', 'POST'],
      path: '/connect/{provider}/{override?}',
      handler: async (req, res) => {
        if (!(req.session || req.yar)) {
          throw new Error('Grant: register session plugin first')
        }

        var session = {}
        session.provider = req.params.provider

        if (req.params.override) {
          session.override = req.params.override
        }
        if (req.method === 'get' && Object.keys(req.query || {}).length) {
          session.dynamic = qs.parse(req.query)
        }
        else if (req.method === 'post' && Object.keys(req.payload || {}).length) {
          session.dynamic = qs.parse(req.payload) // #2985
        }

        var state = req.plugins.grant

        var {url, error} = await consumer.connect({session, state}) // mutates session
        ;(req.session || req.yar).set('grant', session)
        return error ? res.response(error) : res.redirect(url)
      }
    })

    server.route({
      method: 'GET',
      path: '/connect/{provider}/callback',
      handler: async (req, res) => {
        var session = (req.session || req.yar).get('grant') || {}
        var query = qs.parse(req.query)
        var state = req.plugins.grant = req.plugins.grant || {}

        var {url, error} = await consumer.callback({session, query, state}) // mutates session/state
        ;(req.session || req.yar).set('grant', session)
        return error ? res.response(error) : url ? res.redirect(url) : res.continue
      }
    })
  }

  app.pkg = require('../../package.json')

  app.register = register
  return app
}
