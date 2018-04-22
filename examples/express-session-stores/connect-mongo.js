
var express = require('express')
var session = require('express-session')
var grant = require('grant-express')
var MongoStore = require('connect-mongo')(session)

var config = require('./config.json')


express()
  .use(session({
    store: new MongoStore({db: 'grant', url: 'mongodb://localhost:27017/grant'}),
    secret: 'grant', saveUninitialized: true, resave: true
  }))
  .use(grant(config))
  .get('/handle_twitter_callback', (req, res) => {
    res.end(JSON.stringify(req.session.grant.response, null, 2))
  })
  .listen(3000, () => console.log(`Express server listening on port ${3000}`))
