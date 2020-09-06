
var express = require('express')
var session = require('express-session')
var grant = require('../../').express()
var MongoStore = require('connect-mongo')(session)


express()
  .use(session({
    store: new MongoStore({db: 'grant', url: 'mongodb://localhost:27017/grant'}),
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
