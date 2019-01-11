
var express = require('express')
var session = require('express-session')
var grant = require('grant-express')


express()
  .use(session({secret: 'grant', saveUninitialized: true, resave: true}))
  .use(grant(require('./config.json')))

  // http://localhost:3000/connect/facebook
  // http://localhost:3000/connect/facebook/photos
  // http://localhost:3000/connect/facebook/videos
  .get('/hello', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })

  // http://localhost:3000/connect/twitter
  // http://localhost:3000/connect/twitter/write
  .get('/hi', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })

  .listen(3000)
