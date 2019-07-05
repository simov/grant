
var express = require('express')
var cookieSession = require('cookie-session')
var grant = require('grant-express')


express()
  .use(cookieSession({signed: true, secret: 'fwerfe46kurfrgfger456334g',maxAge: 30 * 60 * 1000}))
  .use(grant(require('./config.json'), {isCookieSession: true}))
  .get('/hello', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })
  .get('/hi', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })
  .listen(3000)
