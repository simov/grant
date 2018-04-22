
var express = require('express')
var session = require('express-session')
var parser = require('body-parser')
var grant = require('grant-express')

var config = require('./config.json')

var fs = require('fs')
var form = fs.readFileSync('./form.html', 'utf8')


express()
  .use(session({secret: 'grant', saveUninitialized: true, resave: true}))
  .use(parser.urlencoded({extended: true}))
  .use(grant(config))
  .get('/handle_facebook_callback', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })
  .get('/form', (req, res) => {
    res.writeHead(200, {'content-type': 'text/html'})
    res.end(form)
  })
  .listen(3000, () => console.log(`Express server listening on port ${3000}`))
