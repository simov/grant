
var Koa = require('koa')
var session = require('koa-session')
var grant = require('../../').koa()
var Router = require('koa-router')
var koaqs = require('koa-qs')


var app = new Koa()
app.keys = ['grant']

koaqs(app)
  .use(session(app))
  .use(new Router()
    .all('/connect/:provider/:override?', async (ctx, next) => {
      await next()
      ctx.body = JSON.stringify(ctx.state.grant.response, null, 2)
    })
    .routes())
  .use(grant(require('./config.json')))
  .listen(3000)
