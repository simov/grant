
var express = require('express')
var qs = require('qs')

var config = require('../config')
var flows = {
  1: require('../flow/oauth1'),
  2: require('../flow/oauth2'),
  response: require('../response')
}


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
    var grant = req.session.grant
    var provider = config.provider(app.config, grant)
    var flow = flows[provider.oauth]

    var transport = (data) => {
      if (!provider.callback) {
        res.end(qs.stringify(data))
      }
      else if (!provider.transport || provider.transport === 'querystring') {
        res.redirect((provider.callback || '') + '?' + qs.stringify(data))
      }
      else if (provider.transport === 'session') {
        req.session.grant.response = data
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

  app.get('/connect/:provider/callback', (req, res) => {
    var grant = req.session.grant || {}
    var provider = config.provider(app.config, grant)
    var flow = flows[provider.oauth]

    var transport = (data) => {
      if (!provider.callback) {
        res.end(qs.stringify(data))
      }
      else if (!provider.transport || provider.transport === 'querystring') {
        res.redirect((provider.callback || '') + '?' + qs.stringify(data))
      }
      else if (provider.transport === 'session') {
        req.session.grant.response = data
        res.redirect(provider.callback || '')
      }
    }
    var success = (data) => transport(data)
    var error = (err) => transport({error: err.body})

    if (/^1$/.test(provider.oauth)) {
      flow.access(provider, grant.request, req.query)
        .then(({body}) => {
          success(flows.response(provider, body))
        })
        .catch(error)
    }

    else if (/^2$/.test(provider.oauth)) {
      flow.access(provider, req.query, grant)
        .then(({body}) => {
          success(flows.response(provider, body))
        })
        .catch(error)
    }

    else {
      error({body: 'Grant: missing session or misconfigured provider'})
    }
  })

  return app
}
