'use strict'

var urlib = require('url')
var qs = require('qs')

var config = require('../config')
var flows = {
  1: require('../flow/oauth1'),
  2: require('../flow/oauth2')
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

      function transport (data) {
        if (!provider.transport || provider.transport === 'querystring') {
          res.redirect((provider.callback || '') + '?' + data)
        }
        else if (provider.transport === 'session') {
          grant.response = qs.parse(data)
          ;(req.session || req.yar).set('grant', grant)
          res.redirect(provider.callback || '')
        }
      }

      function callback (err, url) {
        if (err) {
          provider.callback ? transport(err) : res(err)
        }
        else {
          res.redirect(url)
        }
      }

      if (/^1$/.test(provider.oauth)) {
        flow.request(provider, (err, data) => {
          if (err) {
            callback(err)
          }
          else {
            grant.request = data
            var url = flow.authorize(provider, data)
            var error = !/^http|\//.test(url) ? url : null
            callback(error, url)
          }
        })
      }

      else if (/^2$/.test(provider.oauth)) {
        grant.state = provider.state
        var url = flow.authorize(provider)
        callback(null, url)
      }

      else {
        var err = {error: 'Grant: missing or misconfigured provider'}
        callback(qs.stringify(err))
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

        function transport (data) {
          if (!provider.transport || provider.transport === 'querystring') {
            res.redirect((provider.callback || '') + '?' + data)
          }
          else if (provider.transport === 'session') {
            grant.response = qs.parse(data)
            ;(req.session || req.yar).set('grant', grant)
            res.redirect(provider.callback || '')
          }
        }

        function callback (err, data) {
          if (err) {
            provider.callback ? transport(err) : res(err)
          }
          else {
            transport(data)
          }
        }

        if (/^1$/.test(provider.oauth)) {
          flow.access(provider, grant.request, query, (err, data) => {
            if (err) {
              callback(err)
            }
            else {
              var response = flow.callback(provider, data)
              callback(null, response)
            }
          })
        }

        else if (/^2$/.test(provider.oauth)) {
          flow.access(provider, query, grant, (err, data) => {
            if (err) {
              callback(err)
            }
            else {
              var response = flow.callback(provider, data)
              callback(null, response)
            }
          })
        }

        else {
          var err = {error: 'Grant: missing session or misconfigured provider'}
          callback(qs.stringify(err))
        }
      }
    })

    next()
  }

  register.attributes = {
    pkg: require('hapi/package.json')
  }

  app.register = register
  return app
}
