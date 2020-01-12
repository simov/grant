
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

        var session = {}
        session.provider = req.params.provider

        if (req.params.override) {
          session.override = req.params.override
        }
        if (req.method === 'get' && Object.keys(req.query || {}).length) {
          session.dynamic = (parseInt(server.version.split('.')[0]) >= 12)
            ? qs.parse(urlib.parse(req.url, false).query) // #2985
            : req.query
        }
        else if (req.method === 'post' && Object.keys(req.payload || {}).length) {
          session.dynamic = (parseInt(server.version.split('.')[0]) >= 12)
            ? qs.parse(req.payload) // #2985
            : req.payload
        }

        var state = req.plugins.grant

        consumer.connect({session, state}) // mutates session
          .then(({url, error}) => {
            ;(req.session || req.yar).set('grant', session)
            error ? res(error) : res.redirect(url)
          })
      }
    })

    server.route({
      method: 'GET',
      path: '/connect/{provider}/callback',
      handler: (req, res) => {
        var session = (req.session || req.yar).get('grant') || {}
        var query = (parseInt(server.version.split('.')[0]) >= 12)
          ? qs.parse(urlib.parse(req.url, false).query) // #2985
          : req.query
        var state = req.plugins.grant = req.plugins.grant || {}

        consumer.callback({session, query, state}) // mutates session
          .then(({url, error}) => {
            ;(req.session || req.yar).set('grant', session)
            error ? res(error) : url ? res.redirect(url) : res.continue()
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
