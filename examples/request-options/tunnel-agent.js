
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

var tunnel = require('tunnel')
var agent = tunnel.httpsOverHttp({
  proxy: {host: 'localhost', port: 8009}
})

var express = require('express')
var session = require('express-session')
var grant = require('../../').express({
  config: require('./config.json'),
  request: {agent}
})


express()
  .use(session({secret: 'grant', saveUninitialized: true, resave: false}))
  .use(grant)
  .get('/hello', (req, res) => {
    res.end(JSON.stringify(req.session.grant.response, null, 2))
  })
  .get('/hi', (req, res) => {
    res.end(JSON.stringify(req.session.grant.response, null, 2))
  })
  .listen(3000)
