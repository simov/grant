
var express = require('express')
var session = require('express-session')
var logger = require('morgan')

var Grant = require('grant-express')
var grant = new Grant(require('./config.json'))

var app = express()
app.use(logger('dev'))
// REQUIRED:
app.use(session({secret: 'very secret'}))
// mount grant
app.use(grant)

// dummy authorize url
// because http://oauthbin.com doesn't provide one
app.get('/authorize', (req, res) => {
  var qs = require('querystring')
  res.redirect('http://localhost:3000/connect/oauthbin/callback?' +
    qs.stringify({oauth_token: 'requestkey', oauth_verifier: '123'}))
})

app.get('/handle_oauthbin_callback', (req, res) => {
  console.log(req.query)
  // dummy response that we're expecting
  var assert = require('assert')
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

app.listen(3000, () => {
  console.log('Express server listening on port ' + 3000)
})
