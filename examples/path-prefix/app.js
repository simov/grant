
var express = require('express')
var session = require('express-session')
var grant = require('grant-express')


express()
  .use(session({secret: 'grant', saveUninitialized: true, resave: true}))
  .use('/path/prefix', grant(require('./config.json')))

  // http://localhost:3000/path/prefix/connect/facebook/callback
  .get('/hello', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })

  // http://localhost:3000/path/prefix/connect/twitter/callback
  .get('/hi', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })

  .listen(3000)
