
var Koa = require('koa')
var session = require('koa-session')
var Router = require('koa-router')
var qs = require('koa-qs')
var grant = require('../../').koa()


var app = new Koa()
app.keys = ['grant']

qs(app)
  .use(session(app))
  .use(grant(require('./config.json')))
  .use(new Router()
    .get('/hello', (ctx) => {
      ctx.body = JSON.stringify(ctx.query, null, 2)
    })
    .get('/hi', (ctx) => {
      ctx.body = JSON.stringify(ctx.query, null, 2)
    })
    .routes())
  .listen(3000)
