'use strict'

var express = require('express')

var qs = require('qs')

var config = require('../config')
var flows = {
  1: require('../flow/oauth1'),
  2: require('../flow/oauth2'),
  getpocket: require('../flow/getpocket')
}


function Grant (_config) {
  var app = express()
  app.config = config.init(_config)
  app._config = config

  app.all('/connect/:provider/:override?', function (req, res, next) {
    if (!req.session)
      throw new Error('Grant: mount session middleware first')
    if (req.method == 'POST' && !req.body)
      throw new Error('Grant: mount body parser middleware first')
    next()
  })

  app.get('/connect/:provider/:override?', function (req, res, next) {
    if (req.params.override == 'callback') return next()

    req.session.grant = {
      provider:req.params.provider
    }
    if (req.params.override) {
      req.session.grant.override = req.params.override
    }
    if (Object.keys(req.query||{}).length) {
      req.session.grant.dynamic = req.query
    }

    connect(req, res)
  })

  app.post('/connect/:provider/:override?', function (req, res) {
    req.session.grant = {
      provider:req.params.provider
    }
    if (req.params.override) {
      req.session.grant.override = req.params.override
    }
    if (Object.keys(req.body||{}).length) {
      req.session.grant.dynamic = req.body
    }

    connect(req, res)
  })

  function connect (req, res) {
    var grant = req.session.grant
    var provider = config.provider(app.config, grant)
    var flow = flows[provider.oauth]

    if (provider.oauth == 1) {
      flow.step1(provider, function (err, data) {
        if (err) return res.redirect(provider.callback + '?' + err)
        grant.step1 = data
        var url = flow.step2(provider, data)
        res.redirect(url)
      })
    }

    else if (provider.oauth == 2) {
      grant.state = provider.state
      var url = flow.step1(provider)
      res.redirect(url)
    }

    else if (flow) {
      flow.step1(provider, function (err, data) {
        if (err) return res.redirect(provider.callback + '?' + err)
        grant.step1 = data
        var url = flow.step2(provider, data)
        res.redirect(url)
      })
    }

    else {
      var err = {error:'Grant: missing or misconfigured provider'}
      if (provider.callback) {
        res.redirect(provider.callback + '?' + qs.stringify(err))
      } else {
        res.end(JSON.stringify(err))
      }
    }
  }

  app.get('/connect/:provider/callback', function (req, res) {
    var grant = req.session.grant || {}
    var provider = config.provider(app.config, grant)
    var flow = flows[provider.oauth]

    function callback (response) {
      if (!provider.transport || provider.transport == 'querystring') {
        res.redirect(provider.callback + '?' + response)
      }
      else if (provider.transport == 'session') {
        req.session.grant.response = qs.parse(response)
        res.redirect(provider.callback)
      }
    }

    if (provider.oauth == 1) {
      flow.step3(provider, grant.step1, req.query, function (err, response) {
        if (err) return res.redirect(provider.callback + '?' + err)
        callback(response)
      })
    }

    else if (provider.oauth == 2) {
      flow.step2(provider, req.query, grant, function (err, data) {
        if (err) return res.redirect(provider.callback + '?' + err)
        var response = flow.step3(provider, data)
        callback(response)
      })
    }

    else if (flow) {
      flow.step3(provider, grant.step1, function (err, response) {
        if (err) return res.redirect(provider.callback + '?' + err)
        callback(response)
      })
    }

    else {
      var err = {error:'Grant: missing session or misconfigured provider'}
      if (provider.callback) {
        res.redirect(provider.callback + '?' + qs.stringify(err))
      } else {
        res.end(JSON.stringify(err))
      }
    }
  })

  return app
}

exports = module.exports = Grant
