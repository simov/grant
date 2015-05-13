
var express = require('express')
  , session = require('express-session')
  , logger = require('morgan')

var Grant = require('grant-express')
  , grant = new Grant(require('./config.json'))

var app = express()
app.use(logger('dev'))
// REQUIRED:
app.use(session({secret:'very secret'}))
// mount grant
app.use(grant)

app.get('/handle_facebook_callback', function (req, res) {
  console.log(req.session.grant.response)
  res.end(JSON.stringify(req.session.grant.response, null, 2))
})

app.get('/handle_twitter_callback', function (req, res) {
  console.log(req.session.grant.response)
  res.end(JSON.stringify(req.session.grant.response, null, 2))
})

app.listen(3000, function () {
  console.log('Express server listening on port ' + 3000)
})
