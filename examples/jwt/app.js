
var express = require('express')
var logger = require('morgan')
var session = require('express-session')
var Purest = require('purest')
var jwt = require('./jwt')

var Grant = require('grant-express')
var grant = new Grant(require('./config.json'))

var app = express()
app.use(logger('dev'))
// REQUIRED:
app.use(session({
  name: 'grant',
  secret: 'very secret',
  saveUninitialized: false,
  resave: false
}))
// mount grant
app.use(grant)

app.get('/handle_facebook_callback', function (req, res) {
  if (req.query.error) {
    console.log(req.query.error)
    res.end(JSON.stringify(req.query.error))
  }
  else {
    console.log(req.session.grant.response)
    // get the user's profile
    var facebook = new Purest({provider: 'facebook'})
    facebook.query()
      .get('me')
      .auth(req.session.grant.response.access_token)
      .request(function (err, _res, body) {
        // remove the session data
        req.session.destroy(function () {
          // remove the cookie
          res.clearCookie('grant')
          // generate JWT - encode the user's Facebook id and name in it
          var token = jwt.sign({id: body.id, name: body.name})
          res.end(JSON.stringify({jwt: token}, null, 2))
        })
      })
  }
})

app.listen(3000, function () {
  console.log('Express server listening on port ' + 3000)
})
