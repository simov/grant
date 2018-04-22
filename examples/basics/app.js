
var express = require('express')
var session = require('express-session')
var grant = require('grant-express')


express()
  .use(session({secret: 'grant', saveUninitialized: true, resave: true}))
  .use(grant({
    server: {
      protocol: 'http',
      host: 'dummy.com:3000'
    },
    facebook: {
      key: '[APP_ID]',
      secret: '[APP_SECRET]',
      callback: '/handle_callback'
    }
  }))
  .get('/handle_callback', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })
  .listen(3000, () => console.log(`Express server listening on port ${3000}`))
