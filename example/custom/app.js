
var express = require('express')
  , logger = require('morgan')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , session = require('express-session')

var Grant = require('grant-express')
  , grant = new Grant(require('./config.json'))

var app = express()
app.use(logger('dev'))
app.use(grant)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser())
app.use(session({
  name: 'grant', secret: 'very secret',
  saveUninitialized: true, resave: true
}))

// not part of the example
// this is a dummy authorize url
// since http://oauthbin.com/ doesn't provide one
app.get('/authorize', function (req, res) {
  var qs = require('querystring')
  res.redirect('http://localhost:3000/connect/oauthbin/callback?'
    + qs.stringify({oauth_token:'requestkey', oauth_verifier:'123'}))
})

app.get('/callback', function (req, res) {
  console.log(req.query)
  // that's the dummy response we're expecting
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

app.listen(3000, function() {
  console.log('Express server listening on port ' + 3000)
})
