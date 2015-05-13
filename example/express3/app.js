
var express = require('express')

var Grant = require('grant-express')
  , grant = new Grant(require('./config.json'))

var app = express()
app.use(express.logger())
// REQUIRED:
app.use(express.cookieParser())
app.use(express.cookieSession({secret:'very secret'}))
// mount grant
app.use(grant)

app.get('/handle_facebook_callback', function (req, res) {
  console.log(req.query)
  res.end(JSON.stringify(req.query, null, 2))
})

app.get('/handle_twitter_callback', function (req, res) {
  console.log(req.query)
  res.end(JSON.stringify(req.query, null, 2))
})

app.listen(3000, function () {
  console.log('Express server listening on port ' + 3000)
})
