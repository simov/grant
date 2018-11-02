
var urlib = require('url')
var qs = require('qs')

var config = require('../config')
var oauth1 = require('../flow/oauth1')
var oauth2 = require('../flow/oauth2')


module.exports = function (_config) {
  var app = {}

  function register (server, options, next) {
    app.config = config(Object.keys(options).length ? options : _config)

    server.route({
      method: ['GET', 'POST'],
      path: '/connect/{provider}/{override?}',
      handler: (req, res) => {
        if (!(req.session || req.yar)) {
          throw new Error('Grant: register session plugin first')
        }

        var session = {
          provider: req.params.provider
        }
        if (req.params.override) {
          session.override = req.params.override
        }
        if (req.method === 'get' && Object.keys(req.query || {}).length) {
          var query = (parseInt(server.version.split('.')[0]) >= 12)
            ? qs.parse(urlib.parse(req.url, false).query) // #2985
            : req.query
          session.dynamic = query
        }
        if (req.method === 'post' && Object.keys(req.payload || {}).length) {
          var payload = (parseInt(server.version.split('.')[0]) >= 12)
            ? qs.parse(req.payload) // #2985
            : req.payload
          session.dynamic = payload
        }
        ;(req.session || req.yar).set('grant', session)

        connect(req, res)
      }
    })

    var transport = (provider, req, res, session) => (data) => {
      if (!provider.callback) {
        res(qs.stringify(data))
      }
      else if (!provider.transport || provider.transport === 'querystring') {
        res.redirect(`${provider.callback}?${qs.stringify(data)}`)
      }
      else if (provider.transport === 'session') {
        session.response = data
        ;(req.session || req.yar).set('grant', session)
        res.redirect(provider.callback)
      }
    }

    function connect (req, res) {
      var session = (req.session || req.yar).get('grant')
      var provider = config.provider(app.config, session)
      var response = transport(provider, req, res, session)

      if (provider.oauth === 1) {
        oauth1.request(provider)
          .then(({body}) => {
            session.request = body
            oauth1.authorize(provider, body)
              .then((url) => res.redirect(url))
              .catch(response)
          })
          .catch(response)
      }

      else if (provider.oauth === 2) {
        session.state = provider.state
        session.nonce = provider.nonce
        oauth2.authorize(provider)
          .then((url) => res.redirect(url))
          .catch(response)
      }

      else {
        response({error: 'Grant: missing or misconfigured provider'})
      }
    }

    server.route({
      method: 'GET',
      path: '/connect/{provider}/callback',
      handler: (req, res) => {
        var session = (req.session || req.yar).get('grant') || {}
        var provider = config.provider(app.config, session)
        var response = transport(provider, req, res, session)
        var query = (parseInt(server.version.split('.')[0]) >= 12)
          ? qs.parse(urlib.parse(req.url, false).query) // #2985
          : req.query

        if (provider.oauth === 1) {
          oauth1.access(provider, session.request, query)
            .then(response)
            .catch(response)
        }

        else if (provider.oauth === 2) {
          oauth2.access(provider, query, session)
            .then(response)
            .catch(response)
        }

        else {
          response({error: 'Grant: missing session or misconfigured provider'})
        }
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
