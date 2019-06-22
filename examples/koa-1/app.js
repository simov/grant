
var koa = require('koa')
var session = require('koa-session')
var router = require('koa-router')
var koaqs = require('koa-qs')
var grant = require('grant-koa')


var app = koa()
app.keys = ['grant']
app.use(session(app))
app.use(grant(require('./config.json')))
app.use(router(app))
koaqs(app)

app
  .get('/hello', function* (next) {
    this.body = JSON.stringify(this.query, null, 2)
  })
  .get('/hi', function* (next) {
    this.body = JSON.stringify(this.query, null, 2)
  })
  .listen(3000)
