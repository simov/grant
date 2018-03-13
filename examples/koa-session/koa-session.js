
// https://github.com/koajs/session

var koa = require('koa')
var route = require('koa-route')
var mount = require('koa-mount')
var session = require('koa-session')

var Grant = require('grant-koa')
var grant = new Grant(require('./config.json'))

var app = koa()
app.keys = ['whatever']
app.use(session(app))
app.use(mount(grant))

app.use(route.get('/handle_facebook_callback', function* (next) {
  console.log(this.query)
  this.body = JSON.stringify(this.query, null, 2)
}))

app.listen(3000, () => {
  console.log('Koa server listening on port ' + 3000)
})
