
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

        var state = {}
        state.provider = req.params.provider

        if (req.params.override) {
          state.override = req.params.override
        }
        if (req.method === 'get' && Object.keys(req.query || {}).length) {
          state.dynamic = qs.parse(req.query)
        }
        else if (req.method === 'post' && Object.keys(req.payload || {}).length) {
          state.dynamic = qs.parse(req.payload) // #2985
        }

        var {url, error} = await consumer.connect({state}) // mutates state
        ;(req.session || req.yar).set('grant', state)
        return error ? res.response(error) : res.redirect(url)
      }
    })

    server.route({
      method: 'GET',
      path: '/connect/{provider}/callback',
      handler: async (req, res) => {
        var state = (req.session || req.yar).get('grant') || {}
        var query = qs.parse(req.query)

        var {url, error} = await consumer.callback({state, query}) // mutates state
        ;(req.session || req.yar).set('grant', state)
        return error ? res.response(error) : res.redirect(url)
      }
    })
  }

  app.pkg = require('../../package.json')

  app.register = register
  return app
}
