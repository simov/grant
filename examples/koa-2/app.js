
var Koa = require('koa')
var session = require('koa-session')
var Router = require('koa-router')
var koaqs = require('koa-qs')
var grant = require('../../').koa()


var app = new Koa()
app.keys = ['grant']
app.use(session(app))
app.use(grant(require('./config.json')))
koaqs(app)

var router = new Router()
router
  .get('/hello', (ctx) => {
    ctx.body = JSON.stringify(ctx.query, null, 2)
  })
  .get('/hi', (ctx) => {
    ctx.body = JSON.stringify(ctx.query, null, 2)
  })

app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(3000)
