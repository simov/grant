
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
    .all('/connect/google', async (ctx, next) => {
      ctx.state.grant = {dynamic: {scope: ['openid']}}
      await next()
    })
    .all('/connect/twitter', async (ctx, next) => {
      ctx.state.grant = {dynamic: {key: 'CONSUMER_KEY', secret: 'CONSUMER_SECRET'}}
      await next()
    })
    .routes())
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
