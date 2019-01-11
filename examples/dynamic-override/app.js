
var express = require('express')
var session = require('express-session')
var parser = require('body-parser')
var grant = require('grant-express')
var fs = require('fs')


express()
  .use(session({secret: 'grant', saveUninitialized: true, resave: true}))
  .use(parser.urlencoded({extended: true}))
  .use(grant(require('./config.json')))

  // http://localhost:3000/form
  .get('/form', (req, res) => {
    res.writeHead(200, {'content-type': 'text/html'})
    res.end(fs.readFileSync('./form.html', 'utf8'))
  })

  .get('/hello', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })

  .listen(3000)
