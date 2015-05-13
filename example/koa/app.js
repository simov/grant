
var koa = require('koa')
  , session = require('koa-session')
  , router = require('koa-router')
  , mount = require('koa-mount')
  , koaqs = require('koa-qs')
  , accesslog = require('koa-accesslog')

var Grant = require('grant-koa')
  , grant = new Grant(require('./config.json'))

var app = koa()
app.use(accesslog())
// REQUIRED:
app.keys = ['grant']
app.use(session(app))
// mount grant
app.use(mount(grant))
// other middlewares
app.use(router(app))
koaqs(app)

app.get('/handle_facebook_callback', function *(next) {
  console.log(this.query)
  this.body = JSON.stringify(this.query, null, 2)
})

app.get('/handle_twitter_callback', function *(next) {
  console.log(this.query)
  this.body = JSON.stringify(this.query, null, 2)
})

app.listen(3000, function () {
  console.log('Koa server listening on port ' + 3000)
})
