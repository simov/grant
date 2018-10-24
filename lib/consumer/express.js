
var express = require('express')
var qs = require('qs')

var config = require('../config')
var oauth1 = require('../flow/oauth1')
var oauth2 = require('../flow/oauth2')
var response = require('../response')


module.exports = function (_config) {
  var app = express()
  app.config = config.init(_config)

  app.all('/connect/:provider/:override?', (req, res, next) => {
    if (!req.session) {
      throw new Error('Grant: mount session middleware first')
    }
    if (req.method === 'POST' && !req.body) {
      throw new Error('Grant: mount body parser middleware first')
    }
    next()
  })

  app.get('/connect/:provider/:override?', (req, res, next) => {
    if (req.params.override === 'callback') {
      next()
      return
    }

    req.session.grant = {
      provider: req.params.provider
    }
    if (req.params.override) {
      req.session.grant.override = req.params.override
    }
    if (Object.keys(req.query || {}).length) {
      req.session.grant.dynamic = req.query
    }

    connect(req, res)
  })

  app.post('/connect/:provider/:override?', (req, res) => {
    req.session.grant = {
      provider: req.params.provider
    }
    if (req.params.override) {
      req.session.grant.override = req.params.override
    }
    if (Object.keys(req.body || {}).length) {
      req.session.grant.dynamic = req.body
    }

    connect(req, res)
  })

  function connect (req, res) {
    var session = req.session.grant
    var provider = config.provider(app.config, session)

    var transport = (data) => {
      if (!provider.callback) {
        res.end(qs.stringify(data))
      }
      else if (!provider.transport || provider.transport === 'querystring') {
        res.redirect(`${provider.callback}?${qs.stringify(data)}`)
      }
      else if (provider.transport === 'session') {
        session.response = data
        res.redirect(provider.callback)
      }
    }

    if (/^1$/.test(provider.oauth)) {
      oauth1.request(provider)
        .then(({body}) => {
          session.request = body
          oauth1.authorize(provider, body)
            .then((url) => res.redirect(url))
            .catch(transport)
        })
        .catch(transport)
    }

    else if (/^2$/.test(provider.oauth)) {
      session.state = provider.state
      oauth2.authorize(provider)
        .then((url) => res.redirect(url))
        .catch(transport)
    }

    else {
      transport({error: 'Grant: missing or misconfigured provider'})
    }
  }

  app.get('/connect/:provider/callback', (req, res) => {
    var session = req.session.grant
    var provider = config.provider(app.config, session)

    var transport = (data) => {
      if (!provider.callback) {
        res.end(qs.stringify(data))
      }
      else if (!provider.transport || provider.transport === 'querystring') {
        res.redirect(`${provider.callback}?${qs.stringify(data)}`)
      }
      else if (provider.transport === 'session') {
        session.response = data
        res.redirect(provider.callback)
      }
    }

    if (/^1$/.test(provider.oauth)) {
      oauth1.access(provider, session.request, req.query)
        .then(({body}) => transport(response(provider, body)))
        .catch(transport)
    }

    else if (/^2$/.test(provider.oauth)) {
      oauth2.access(provider, req.query, session)
        .then(({body}) => transport(response(provider, body)))
        .catch(transport)
    }

    else {
      transport({error: 'Grant: missing session or misconfigured provider'})
    }
  })

  return app
}
