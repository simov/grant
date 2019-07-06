
var express = require('express')
var qs = require('qs')

var config = require('../config')
var oauth1 = require('../flow/oauth1')
var oauth2 = require('../flow/oauth2')


module.exports = function (_config) {
  var app = express()
  app.config = config(_config)

  app.use('/connect/:provider/:override?', (req, res) => {
    if (!req.session) {
      throw new Error('Grant: mount session middleware first')
    }
    if (req.method === 'POST' && !req.body) {
      throw new Error('Grant: mount body parser middleware first')
    }

    if (req.params.override === 'callback') {
      callback(req, res)
      return
    }

    var session = req.session.grant = req.session.grant || {}
    session.provider = req.params.provider

    if (req.params.override) {
      session.override = req.params.override
    }

    if (req.method === 'GET' && Object.keys(req.query || {}).length) {
      session.dynamic = req.query
    }
    else if (req.method === 'POST' && Object.keys(req.body || {}).length) {
      session.dynamic = req.body
    }

    connect(req, res)
  })

  var transport = (provider, req, res, session) => (data) => {
    if (!provider.callback) {
      res.end(qs.stringify(data))
    }
    else if (!provider.transport || provider.transport === 'querystring') {
      redirect(req, res, `${provider.callback}?${qs.stringify(data)}`)
    }
    else if (provider.transport === 'session') {
      session.response = data
      redirect(req, res, provider.callback)
    }
  }

  var redirect = (req, res, url) =>
    typeof req.session.save === 'function' && req.session.save.length
      ? req.session.save(() => res.redirect(url))
      : res.redirect(url)

  function connect (req, res) {
    var session = req.session.grant
    var provider = config.provider(app.config, session)
    var response = transport(provider, req, res, session)

    if (provider.oauth === 1) {
      oauth1.request(provider)
        .then(({body}) => {
          session.request = body
          oauth1.authorize(provider, body)
            .then((url) => redirect(req, res, url))
            .catch(response)
        })
        .catch(response)
    }

    else if (provider.oauth === 2) {
      session.state = provider.state
      session.nonce = provider.nonce
      oauth2.authorize(provider)
        .then((url) => redirect(req, res, url))
        .catch(response)
    }

    else {
      response({error: 'Grant: missing or misconfigured provider'})
    }
  }

  function callback (req, res) {
    var session = req.session.grant || {}
    var provider = config.provider(app.config, session)
    var response = transport(provider, req, res, session)

    if (provider.oauth === 1) {
      oauth1.access(provider, session.request, req.query)
        .then(response)
        .catch(response)
    }

    else if (provider.oauth === 2) {
      oauth2.access(provider, req.query, session)
        .then(response)
        .catch(response)
    }

    else {
      response({error: 'Grant: missing session or misconfigured provider'})
    }
  }

  return app
}
