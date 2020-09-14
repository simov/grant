
var Koa = require('koa')
var session = require('koa-session')
var parser = require('koa-bodyparser')
var Router = require('koa-router')
var grant = require('../../').koa()
var fs = require('fs')


var app = new Koa()
app.keys = ['grant']

app
  .use(session(app))
  .use(parser())
  .use(grant(require('./config.json')))
  .use(new Router()
    .get('/login', (ctx) => {
      ctx.body = fs.readFileSync('./form.html', 'utf8')
    })
    .get('/hello', (ctx) => {
      ctx.body = JSON.stringify(ctx.session.grant.response, null, 2)
    })
    .routes())
  .listen(3000)
