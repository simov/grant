
var urlib = require('url')
var qs = require('qs')

var _consumer = require('../consumer')


module.exports = function (config) {
  var app = {}

  function register (server, options, next) {
    var consumer = _consumer({
      config: Object.keys(options).length ? options : config
    })
    app.config = consumer.config

    // connect
    server.route({
      method: ['GET', 'POST'],
      path: '/connect/{provider}/{override?}',
      handler: (req, res) => {
        if (!(req.session || req.yar)) {
          throw new Error('Grant: register session plugin first')
        }

        var state = {}
        state.provider = req.params.provider

        if (req.params.override) {
          state.override = req.params.override
        }
        if (req.method === 'get' && Object.keys(req.query || {}).length) {
          state.dynamic = (parseInt(server.version.split('.')[0]) >= 12)
            ? qs.parse(urlib.parse(req.url, false).query) // #2985
            : req.query
        }
        else if (req.method === 'post' && Object.keys(req.payload || {}).length) {
          state.dynamic = (parseInt(server.version.split('.')[0]) >= 12)
            ? qs.parse(req.payload) // #2985
            : req.payload
        }

        consumer.connect({state}) // mutates state
          .then(({url, error}) => {
            ;(req.session || req.yar).set('grant', state)
            error ? res(error) : res.redirect(url)
          })
      }
    })

    server.route({
      method: 'GET',
      path: '/connect/{provider}/callback',
      handler: (req, res) => {
        var state = (req.session || req.yar).get('grant') || {}
        var query = (parseInt(server.version.split('.')[0]) >= 12)
          ? qs.parse(urlib.parse(req.url, false).query) // #2985
          : req.query

        consumer.callback({state, query}) // mutates state
          .then(({url, error}) => {
            ;(req.session || req.yar).set('grant', state)
            error ? res(error) : res.redirect(url)
          })
      }
    })

    next()
  }

  register.attributes = {
    pkg: require('../../package.json')
  }

  app.register = register
  return app
}
