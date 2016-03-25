
var express = require('express')
var session = require('express-session')
var logger = require('morgan')

var Grant = require('grant-express')
var grant = new Grant(require('./config.json'))

var Purest = require('purest')
var facebook = new Purest({provider: 'facebook'})
var twitter = new Purest({provider: 'twitter',
      key: grant.config.twitter.key, secret: grant.config.twitter.secret})


var app = express()
app.use(logger('dev'))
// REQUIRED:
app.use(session({secret: 'very secret'}))
// mount grant
app.use(grant)

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
    .qs({user_id: req.query.raw.user_id})
    .auth(req.query.access_token, req.query.access_secret)
    .request(function (err, _res, body) {
      res.end(JSON.stringify({
        oauth: req.query,
        profile: body
      }, null, 2))
    })
})

app.listen(3000, function () {
  console.log('Express server listening on port ' + 3000)
})
