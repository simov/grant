
var express = require('express')
var session = require('express-session')
var grant = require('grant-express')
var request = require('request-compose').client
var jwt = require('./jwt')


express()
  .use(session({name: 'grant', secret: 'grant', saveUninitialized: true, resave: true}))
  .use(grant(require('./config.json')))

  .get('/hello', async (req, res) => {
    var {body} = await request({
      url: 'https://graph.facebook.com/v2.12/me',
      headers: {authorization: `Bearer ${req.session.grant.response.access_token}`}
    })
    // remove the session data
    req.session.destroy(() => {
      // remove the cookie
      res.clearCookie('grant')
      // generate JWT - encode the user's Facebook id and name in it
      var token = jwt.sign({id: body.id, name: body.name})
      res.end(JSON.stringify({jwt: token}, null, 2))
    })
  })

  .listen(3000)
