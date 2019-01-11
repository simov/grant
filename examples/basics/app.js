
var express = require('express')
var session = require('express-session')
var grant = require('grant-express')


express()
  .use(session({secret: 'grant', saveUninitialized: true, resave: true}))
  .use(grant({
    defaults: {
      protocol: 'http',
      host: 'localhost:3000'
    },
    facebook: {
      key: 'APP_ID',
      secret: 'APP_SECRET',
      callback: '/hello'
    },
    twitter: {
      key: 'CONSUMER_KEY',
      secret: 'CONSUMER_SECRET',
      callback: '/hi'
    }
  }))
  .get('/hello', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })
  .get('/hi', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })
  .listen(3000)
