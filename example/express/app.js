
var express = require('express')
  , logger = require('morgan')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , session = require('express-session')

var Grant = require('grant').express()
  , grant = new Grant(require('./config'))

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
  console.log(req.query)
  res.end(JSON.stringify(req.query, null, 2))
})

app.get('/handle_twitter_callback', function (req, res) {
  console.log(req.query)
  res.end(JSON.stringify(req.query, null, 2))
})

app.listen(3000, function() {
  console.log('Express server listening on port ' + 3000)
})
