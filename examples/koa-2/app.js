
var Koa = require('koa')
var session = require('koa-session')
var mount = require('koa-mount')
var Router = require('koa-router')
var koaqs = require('koa-qs')
var grant = require('grant-koa')


var app = new Koa()
app.keys = ['grant']
app.use(session(app))
app.use(mount(grant(require('./config.json'))))
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
