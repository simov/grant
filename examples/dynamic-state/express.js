
var express = require('express')
var session = require('express-session')
var grant = require('../../').express()


express()
  .use(session({secret: 'grant', saveUninitialized: true, resave: false}))
  .use('/connect/google', (req, res, next) => {
    res.locals.grant = {dynamic: {scope: ['openid']}}
    next()
  })
  .use('/connect/twitter', (req, res, next) => {
    res.locals.grant = {dynamic: {key: 'CONSUMER_KEY', secret: 'CONSUMER_SECRET'}}
    next()
  })
  .use(grant(require('./config.json')))
  .get('/hello', (req, res) => {
    res.end(JSON.stringify(req.session.grant.response, null, 2))
  })
  .get('/hi', (req, res) => {
    res.end(JSON.stringify(req.session.grant.response, null, 2))
  })
  .listen(3000)
