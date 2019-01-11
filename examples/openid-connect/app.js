
var express = require('express')
var session = require('express-session')
var grant = require('grant-express')
var oidc = require('grant-oidc')

var config = require('./config.json')


express()
  .use(session({name: 'grant', secret: 'grant', saveUninitialized: true, resave: true}))
  .use(grant(config))
  .get('/hello', oidc(config), (req, res) => {
    res.end(JSON.stringify(req.session.grant.response, null, 2))
  })
  .listen(3000)
