
var express = require('express')
var session = require('express-session')
var logger = require('morgan')
var RedisStore = require('connect-redis')(session)

var Grant = require('grant-express')
var grant = new Grant(require('./config.json'))

var app = express()
app.use(logger('dev'))
// REQUIRED:
app.use(session({
  store: new RedisStore(),
  secret: 'very secret'
}))
// mount grant
app.use(grant)

app.get('/handle_twitter_callback', function (req, res) {
  console.log(req.query)
  res.end(JSON.stringify(req.query, null, 2))
})

app.listen(3000, function () {
  console.log('Express server listening on port ' + 3000)
})
