
var express = require('express')
var session = require('cookie-session')
var grant = require('../../').express()


express()
  .use(session({signed: true, secret: 'grant', maxAge: 30 * 60 * 1000}))
  .use(grant(require('./config.json')))
  .get('/hello', (req, res) => {
    res.end(JSON.stringify(req.session.grant.response, null, 2))
  })
  .get('/hi', (req, res) => {
    res.end(JSON.stringify(req.session.grant.response, null, 2))
  })
  .listen(3000)
