
var Koa = require('koa')
var session = require('koa-generic-session')
var Redis = require('koa-redis')
var Router = require('koa-router')
var grant = require('../../').koa()


var app = new Koa()
app.keys = ['grant']

app
  .use(session({store: Redis()}))
  .use(grant(require('./config.json')))
  .use(new Router()
    .get('/hello', (ctx) => {
      ctx.body = JSON.stringify(ctx.session.grant.response, null, 2)
    })
    .get('/hi', (ctx) => {
      ctx.body = JSON.stringify(ctx.session.grant.response, null, 2)
    })
    .routes())
  .listen(3000)
