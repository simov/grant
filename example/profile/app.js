
var express = require('express')
  , logger = require('morgan')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , session = require('express-session')

var Grant = require('grant-express')
  , grant = new Grant(require('./config.json'))

var Purest = require('purest')
  , facebook = new Purest({provider: 'facebook'})
  , twitter = new Purest({provider: 'twitter',
      key:grant.config.twitter.key, secret:grant.config.twitter.secret})


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

app.get('/handle_facebook_callback', function (req, res) {
  facebook.query()
    .get('me')
    .auth(req.query.access_token)
    .request(function (err, _res, body) {
      res.end(JSON.stringify({
        oauth: req.query,
        profile: body
      }, null, 2))
    })
})

app.get('/handle_twitter_callback', function (req, res) {
  twitter.query()
    .get('users/show')
    .qs({user_id:req.query.raw.user_id})
    .auth(req.query.access_token, req.query.access_secret)
    .request(function (err, _res, body) {
      res.end(JSON.stringify({
        oauth: req.query,
        profile: body
      }, null, 2))
    })
})

app.listen(3000, function() {
  console.log('Express server listening on port ' + 3000)
})
