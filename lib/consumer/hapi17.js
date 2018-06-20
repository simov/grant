
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

  function register (server, options) {
    app.config = config.init(Object.keys(options).length ? options : _config)

    server.route({
      method: ['GET', 'POST'],
      path: '/connect/{provider}/{override?}',
      handler: async (req, res) => {
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
          var query = qs.parse(urlib.parse(req.url, false).query) // #2985
          session.dynamic = query
        }
        if (req.method === 'post' && Object.keys(req.payload || {}).length) {
          var payload = qs.parse(req.payload) // #2985
          session.dynamic = payload
        }
        ;(req.session || req.yar).set('grant', session)

        return connect(req, res)
      }
    })

    async function connect (req, res) {
      var grant = (req.session || req.yar).get('grant')
      var provider = config.provider(app.config, grant)
      var flow = flows[provider.oauth]

      var transport = (data) => {
        if (!provider.callback) {
          return res.response(qs.stringify(data))
        }
        else if (!provider.transport || provider.transport === 'querystring') {
          return res.redirect((provider.callback || '') + '?' + qs.stringify(data))
        }
        else if (provider.transport === 'session') {
          grant.response = data
          ;(req.session || req.yar).set('grant', grant)
          return res.redirect(provider.callback || '')
        }
      }
      var success = (url) => res.redirect(url)
      var error = (err) => transport({error: err.body})

      if (/^1$/.test(provider.oauth)) {
        try {
          var {body} = await flow.request(provider)
          grant.request = body
          var url = await flow.authorize(provider, body)
          return success(url)
        }
        catch (err) {
          return error(err)
        }
      }

      else if (/^2$/.test(provider.oauth)) {
        try {
          grant.state = provider.state
          var url = await flow.authorize(provider)
          return success(url)
        }
        catch (err) {
          return error(err)
        }
      }

      else {
        return error({body: 'Grant: missing or misconfigured provider'})
      }
    }

    server.route({
      method: 'GET',
      path: '/connect/{provider}/callback',
      handler: async (req, res) => {
        var grant = (req.session || req.yar).get('grant') || {}
        var provider = config.provider(app.config, grant)
        var flow = flows[provider.oauth]
        var query = qs.parse(urlib.parse(req.url, false).query) // #2985

        var transport = (data) => {
          if (!provider.callback) {
            return res.response(qs.stringify(data))
          }
          else if (!provider.transport || provider.transport === 'querystring') {
            return res.redirect((provider.callback || '') + '?' + qs.stringify(data))
          }
          else if (provider.transport === 'session') {
            grant.response = data
            ;(req.session || req.yar).set('grant', grant)
            return res.redirect(provider.callback || '')
          }
        }
        var success = (data) => transport(data)
        var error = (err) => transport({error: err.body})

        if (/^1$/.test(provider.oauth)) {
          try {
            var {body} = await flow.access(provider, grant.request, query)
            return success(flows.response(provider, body))
          }
          catch (err) {
            return error(err)
          }
        }

        else if (/^2$/.test(provider.oauth)) {
          try {
            var {body} = await flow.access(provider, query, grant)
            return success(flows.response(provider, body))
          }
          catch (err) {
            return error(err)
          }
        }

        else {
          return error({body: 'Grant: missing session or misconfigured provider'})
        }
      }
    })
  }

  app.pkg = require('../../package.json')

  app.register = register
  return app
}
