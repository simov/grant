
var express = require('express')
var grant = require('grant-express')

var config = require('./config.json')


express()
  .use(express.logger())
  .use(express.cookieParser())
  .use(express.cookieSession({secret: 'grant'}))
  .use(grant(config))
  .get('/facebook_callback', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })
  .get('/twitter_callback', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })
  .listen(3000, () => console.log(`Express server listening on port ${3000}`))
