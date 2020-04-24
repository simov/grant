
var express = require('express')
var session = require('express-session')
var grant = require('../../').express()


express()
  .use(session({secret: 'grant', saveUninitialized: true, resave: false}))
  .use('/connect/:provider/:override?', express()
    .use(grant(require('./config.json')))
    .use((req, res) => {
      res.end(JSON.stringify(res.locals.grant.response, null, 2))
    })
  )
  .listen(3000)
