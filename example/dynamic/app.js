
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var express = require('express')
  , logger = require('morgan')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , session = require('express-session')

var Grant = require('grant').express()
  , grant = new Grant(require('./config'))

var request = require('request')

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

app.get('/connect_facebook', function (req, res) {
  var url = grant.config.facebook.protocol + '://'
    + grant.config.facebook.host + '/connect/facebook'
  request.post(url, {
    form: {
      // some random 6 digit number
      state: (Math.floor(Math.random() * 999999) + 1)
    },
    followRedirect: false
  }, function (err, _res, body) {
    res.set('set-cookie', _res.headers['set-cookie'][0])
    res.redirect(_res.headers.location)
  })
})

app.get('/handle_facebook_callback', function (req, res) {
  console.log('The state was', req.session.grant.state)
  console.log(req.query)
  res.end(JSON.stringify(req.query, null, 2))
})

app.listen(3000, function() {
  console.log('Express server listening on port ' + 3000)
})
