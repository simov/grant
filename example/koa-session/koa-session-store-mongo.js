
// https://github.com/hiddentao/koa-session-store
// https://github.com/hiddentao/koa-session-mongo

var koa = require('koa')
var route = require('koa-route')
var mount = require('koa-mount')
var session = require('koa-session-store')
var mongoStore = require('koa-session-mongo')

var Grant = require('grant-koa')
var grant = new Grant(require('./config.json'))

var app = koa()
app.keys = ['whatever']
app.use(session({
  store: mongoStore.create({
    db: 'test'
  })
}))
app.use(mount(grant))

app.use(route.get('/handle_facebook_callback', function* (next) {
  console.log(this.query)
  this.body = JSON.stringify(this.query, null, 2)
}))

app.listen(3000, function () {
  console.log('Koa server listening on port ' + 3000)
})
