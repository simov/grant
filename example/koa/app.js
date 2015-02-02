
var koa = require('koa')
  , router = require('koa-router')
  , mount = require('koa-mount')
  , bodyParser = require('koa-bodyparser')
  , koaqs = require('koa-qs')
  , session = require('koa-session')
  , accesslog = require('koa-accesslog')

var Grant = require('grant').koa()
  , grant = new Grant(require('./config.json'))

var app = koa()
app.keys = ['secret','key']
app.use(accesslog())
app.use(mount(grant))
app.use(bodyParser())
app.use(session(app))
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

app.listen(3000, function() {
  console.log('Koa server listening on port ' + 3000)
})
