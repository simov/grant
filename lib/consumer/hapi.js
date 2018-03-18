
var urlib = require('url')
var qs = require('qs')

var config = require('../config')
var flows = {
  1: require('../flow/oauth1'),
  2: require('../flow/oauth2'),
  response: require('../response')
}


module.exports = function (_config) {
  var app = {}

  function register (server, options, next) {
    app.config = config.init(Object.keys(options).length ? options : _config)

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

    function connect (req, res) {
      var grant = (req.session || req.yar).get('grant')
      var provider = config.provider(app.config, grant)
      var flow = flows[provider.oauth]

      var transport = (data) => {
        if (!provider.callback) {
          res(qs.stringify(data))
        }
        else if (!provider.transport || provider.transport === 'querystring') {
          res.redirect((provider.callback || '') + '?' + qs.stringify(data))
        }
        else if (provider.transport === 'session') {
          grant.response = data
          ;(req.session || req.yar).set('grant', grant)
          res.redirect(provider.callback || '')
        }
      }
      var success = (url) => res.redirect(url)
      var error = (err) => transport({error: err.body})

      if (/^1$/.test(provider.oauth)) {
        flow.request(provider)
          .then(({body}) => {
            grant.request = body
            flow.authorize(provider, body)
              .then(success)
              .catch(error)
          })
          .catch(error)
      }

      else if (/^2$/.test(provider.oauth)) {
        grant.state = provider.state
        flow.authorize(provider)
          .then(success)
          .catch(error)
      }

      else {
        error({body: 'Grant: missing or misconfigured provider'})
      }
    }

    server.route({
      method: 'GET',
      path: '/connect/{provider}/callback',
      handler: (req, res) => {
        var grant = (req.session || req.yar).get('grant') || {}
        var provider = config.provider(app.config, grant)
        var flow = flows[provider.oauth]
        var query = (parseInt(server.version.split('.')[0]) >= 12)
          ? qs.parse(urlib.parse(req.url, false).query) // #2985
          : req.query

        var transport = (data) => {
          if (!provider.callback) {
            res(qs.stringify(data))
          }
          else if (!provider.transport || provider.transport === 'querystring') {
            res.redirect((provider.callback || '') + '?' + qs.stringify(data))
          }
          else if (provider.transport === 'session') {
            grant.response = data
            ;(req.session || req.yar).set('grant', grant)
            res.redirect(provider.callback || '')
          }
        }
        var success = (data) => transport(data)
        var error = (err) => transport({error: err.body})

        if (/^1$/.test(provider.oauth)) {
          flow.access(provider, grant.request, query)
            .then(({body}) => {
              success(flows.response(provider, body))
            })
            .catch(error)
        }

        else if (/^2$/.test(provider.oauth)) {
          flow.access(provider, query, grant)
            .then(({body}) => {
              success(flows.response(provider, body))
            })
            .catch(error)
        }

        else {
          error({body: 'Grant: missing session or misconfigured provider'})
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
