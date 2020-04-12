
var express = require('express')
var session = require('express-session')
var grant = require('../../').express()


express()
  .use(session({secret: 'grant', saveUninitialized: true, resave: true}))
  .use('/oauth', grant(require('./config.json')))

  // http://localhost:3000/oauth/facebook/callback
  .get('/hello', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })

  // http://localhost:3000/oauth/twitter/callback
  .get('/hi', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })

  .listen(3000)
