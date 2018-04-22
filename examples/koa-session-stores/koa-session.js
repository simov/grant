
// https://github.com/koajs/session

var koa = require('koa')
var session = require('koa-session')
var mount = require('koa-mount')
var router = require('koa-router')
var koaqs = require('koa-qs')
var grant = require('grant-koa')

var config = require('./config.json')


var app = koa()
app.keys = ['grant']
app.use(session(app))
app.use(mount(grant(config)))
app.use(router(app))
koaqs(app)

app
  .get('/handle_facebook_callback', function* (next) {
    this.body = JSON.stringify(this.session.grant.response, null, 2)
  })
  .listen(3000, () => console.log(`Koa server listening on port ${3000}`))
