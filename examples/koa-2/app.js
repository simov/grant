
var Koa = require('koa')
var session = require('koa-session')
var mount = require('koa-mount')
var Router = require('koa-router')
var koaqs = require('koa-qs')
var grant = require('grant-koa')

var config = require('./config.json')


var app = new Koa()

app.keys = ['grant']
app.use(session(app))
app.use(mount(grant(config)))
koaqs(app)

var router = new Router()
router
  .get('/handle_facebook_callback', (ctx) => {
    ctx.body = JSON.stringify(ctx.query, null, 2)
  })
  .get('/handle_twitter_callback', (ctx) => {
    ctx.body = JSON.stringify(ctx.query, null, 2)
  })

app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(3000, () => console.log(`Koa2 server listening on port ${3000}`))
