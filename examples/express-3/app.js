
var express = require('express')
var grant = require('grant-express')


express()
  .use(express.logger())
  .use(express.cookieParser())
  .use(express.cookieSession({secret: 'grant'}))
  .use(grant(require('./config.json')))
  .get('/hello', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })
  .get('/hi', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })
  .listen(3000)
