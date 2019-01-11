
var express = require('express')
var session = require('express-session')
var grant = require('grant-express')
var qs = require('querystring')
var assert = require('assert')


express()
  .use(session({secret: 'grant', saveUninitialized: true, resave: true}))
  .use(grant(require('./config.json')))

  // fake authorize url
  .get('/authorize', (req, res) => {
    res.redirect('http://localhost:3000/connect/oauthbin/callback?' +
      qs.stringify({oauth_token: 'requestkey', oauth_verifier: '123'}))
  })

  .get('/hello', (req, res) => {
    // dummy response sent by http://oauthbin.com
    assert.deepEqual(req.query, {
      access_token: 'accesskey',
      access_secret: 'accesssecret',
      raw: {
        oauth_token: 'accesskey',
        oauth_token_secret: 'accesssecret'
      }
    })
    res.end(JSON.stringify(req.query, null, 2))
  })

  .listen(3000)
