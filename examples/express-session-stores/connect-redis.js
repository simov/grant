
var express = require('express')
var session = require('express-session')
var grant = require('../../').express()
var RedisStore = require('connect-redis')(session)


express()
  .use(session({
    store: new RedisStore(),
    secret: 'grant', saveUninitialized: true, resave: false
  }))
  .use(grant(require('./config.json')))
  .get('/hello', (req, res) => {
    res.end(JSON.stringify(req.session.grant.response, null, 2))
  })
  .get('/hi', (req, res) => {
    res.end(JSON.stringify(req.session.grant.response, null, 2))
  })
  .listen(3000)
