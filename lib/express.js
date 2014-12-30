
var express = require('express'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  session = require('express-session')

var config = require('./config')
var flows = {
  1: require('./oauth1'),
  2: require('./oauth2'),
  getpocket: require('./getpocket')
}


function Grant (_config) {
  var app = express()
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({extended: true}))
  app.use(cookieParser())
  app.use(session({
      name: 'grant', secret: 'very secret',
      saveUninitialized: true, resave: true
    }))

  app.config = config.init(_config)

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
    var provider = config.provider(app.config, grant)
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
