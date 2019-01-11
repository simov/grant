
// https://github.com/koajs/generic-session
// https://github.com/pavelvlasov/koa-generic-session-mongo

var koa = require('koa')
var session = require('koa-generic-session')
var Store = require('koa-generic-session-mongo')
var mount = require('koa-mount')
var router = require('koa-router')
var koaqs = require('koa-qs')
var grant = require('grant-koa')


var app = koa()
app.keys = ['grant']
app.use(session({store: new Store()}))
app.use(mount(grant(require('./config.json'))))
app.use(router(app))
koaqs(app)

app
  .get('/hello', function* (next) {
    this.body = JSON.stringify(this.session.grant.response, null, 2)
  })
  .get('/hi', function* (next) {
    this.body = JSON.stringify(this.session.grant.response, null, 2)
  })
  .listen(3000)
