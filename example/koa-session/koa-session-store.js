
// https://github.com/hiddentao/koa-session-store

var koa = require('koa')
  , route = require('koa-route')
  , mount = require('koa-mount')
  , session = require('koa-session-store')

var Grant = require('grant-koa')
  , grant = new Grant(require('./config.json'))

var app = koa()
app.keys = ['whatever']
app.use(session())
app.use(mount(grant))

app.use(route.get('/handle_facebook_callback', function* (next) {
  console.log(this.query)
  this.body = JSON.stringify(this.query, null, 2)
}))

app.listen(3000, function() {
  console.log('Koa server listening on port ' + 3000)
})
