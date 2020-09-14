
var express = require('express')
var session = require('express-session')
var parser = require('body-parser')
var grant = require('../../').express()
var fs = require('fs')


express()
  .use(session({secret: 'grant', saveUninitialized: true, resave: false}))
  .use(parser.urlencoded({extended: true}))
  .use(grant(require('./config.json')))
  .get('/login', (req, res) => {
    res.writeHead(200, {'content-type': 'text/html'})
    res.end(fs.readFileSync('./form.html', 'utf8'))
  })
  .get('/hello', (req, res) => {
    res.end(JSON.stringify(req.session.grant.response, null, 2))
  })
  .listen(3000)
