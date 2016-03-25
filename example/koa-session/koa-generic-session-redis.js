
// https://github.com/koajs/generic-session
// https://github.com/koajs/koa-redis

var koa = require('koa')
var route = require('koa-route')
var mount = require('koa-mount')
var session = require('koa-generic-session')
var redisStore = require('koa-redis')

var Grant = require('grant-koa')
var grant = new Grant(require('./config.json'))

var app = koa()
app.keys = ['whatever']
app.use(session({
  store: redisStore()
}))
app.use(mount(grant))

app.use(route.get('/handle_facebook_callback', function* (next) {
  console.log(this.query)
  this.body = JSON.stringify(this.query, null, 2)
}))

app.listen(3000, function () {
  console.log('Koa server listening on port ' + 3000)
})
