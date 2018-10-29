
var express = require('express')
var session = require('express-session')
var grant = require('grant-express')

var compose = require('request-compose')
compose.Request.oauth = require('request-oauth')
var request = compose.client

var config = require('./config.json')


express()
  .use(session({secret: 'grant', saveUninitialized: true, resave: true}))
  .use(grant(config))
  .get('/facebook_callback', async (req, res) => {
    var {body} = await request({
      url: 'https://graph.facebook.com/me',
      headers: {authorization: `Bearer ${req.query.access_token}`}
    })
    res.end(JSON.stringify({oauth: req.query, profile: body}, null, 2))
  })
  .get('/twitter_callback', async (req, res) => {
    var {body} = await request({
      url: 'https://api.twitter.com/1.1/users/show.json',
      qs: {user_id: req.query.raw.user_id},
      oauth: {
        consumer_key: config.twitter.key,
        consumer_secret: config.twitter.secret,
        token: req.query.access_token,
        token_secret: req.query.access_secret,
      }
    })
    res.end(JSON.stringify({oauth: req.query, profile: body}, null, 2))
  })
  .listen(3000, () => console.log(`Express server listening on port ${3000}`))
