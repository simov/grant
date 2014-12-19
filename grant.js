
var express = require('express'),
  bodyParser = require('body-parser'),
  multipart = require('connect-multiparty'),
  cookieParser = require('cookie-parser'),
  session = require('express-session'),
  favicon = require('serve-favicon')

var request = require('request')
var qs = require('qs')

var config = require('./lib/config')
var flows = {
  1: require('./lib/oauth1'),
  2: require('./lib/oauth2'),
  getpocket: require('./lib/getpocket')
}


function Grant (_config) {
  var app = express()
    .use(favicon(__dirname+'/favicon.ico'))
    // body parser
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({extended: true}))
    .use(multipart())
    // session
    .use(cookieParser())
    .use(session({
      name: 'grant', secret: 'very secret',
      saveUninitialized: true, resave: true
    }))

  app.config = config.init(_config)

  function p (provider, override) {
    if (override && provider.overrides) {
      var override = provider.overrides[override]
      if (override) return override
    }
    return provider
  }

  app.get('/connect/:provider/:override?', function (req, res, next) {
    if (req.params.override == 'callback') return next()

    req.session.grant = {
      provider:req.params.provider,
      override:req.params.override
    }

    connect(req, res)
  })

  app.post('/connect/:provider/:override?', function (req, res) {
    req.session.grant = {
      provider:req.params.provider,
      override:req.params.override,
      dynamic:req.body
    }

    connect(req, res)
  })

  function connect (req, res) {
    var grant = req.session.grant
    var provider = app.config.app[grant.provider]
    if (grant.override) {
      provider = p(provider, grant.override)
    }
    if (grant.dynamic) {
      provider = config.dynamic(provider, dynamic)
    }

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
      var url = flow.step1(provider)
      res.redirect(url)
    }

    else if (provider.custom) {
      flow = flows[provider.name]
      flow.step1(provider, function (err, data) {
        if (err) return res.redirect(provider.callback + '?' + err)

        grant.step1 = data

        var url = flow.step2(provider, data)
        res.redirect(url)
      })
    }
  }

  app.get('/connect/:provider/callback', function (req, res) {
    var grant = req.session.grant
    var provider = app.config.app[grant.provider]
    if (grant.override) {
      provider = p(provider, grant.override)
    }
    if (grant.dynamic) {
      provider = config.dynamic(provider, dynamic)
    }

    var flow = flows[provider.oauth]

    if (provider.oauth == 1) {
      flow.step3(provider, grant.step1, req.query, function (err, url) {
        if (err) return res.redirect(provider.callback + '?' + err)
        res.redirect(url)
      })
    }

    else if (provider.oauth == 2) {
      flow.step2(provider, req.query, function (err, data) {
        if (err) return res.redirect(provider.callback + '?' + err)
        var url = flow.step3(provider, data)
        res.redirect(url)
      })
    }

    else if (provider.custom) {
      flow = flows[provider.name]

      flow.step3(provider, grant.step1, function (err, url) {
        if (err) return res.redirect(provider.callback + '?' + err)
        res.redirect(url)
      })
    }
  })

  return app
}

exports = module.exports = Grant
