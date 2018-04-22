
var express = require('express')
var session = require('express-session')
var grant = require('grant-express')

var config = require('./config.json')


express()
  .use(session({secret: 'grant', saveUninitialized: true, resave: true}))
  .use(grant(config))
  .get('/handle_twitter_callback', (req, res) => {
    res.end(JSON.stringify(req.session.grant.response, null, 2))
  })
  .listen(3000, () => console.log(`Express server listening on port ${3000}`))
