
var Koa = require('koa')
var koasession = require('koa-session')
var koabody = require('koa-bodyparser')
var mount = require('koa-mount')
var convert = require('koa-convert')
var koaqs = require('koa-qs')

var Grant = require('../../../')

var _Koa = Koa
Koa = function () {
  var version = parseInt(require('koa/package.json').version.split('.')[0])

  var app = new _Koa()

  if (version >= 2) {
    var _use = app.use
    app.use = (mw) => _use.call(app, convert(mw))
  }

  return app
}

function* callback () {
  if (this.path === '/') {
    this.response.status = 200
    this.set('content-type', 'application/json')
    this.body = JSON.stringify({
      session: this.session.grant,
      response: this.session.grant.response || this.request.query,
    })
  }
}

module.exports = {
  mount: (config, port) => new Promise((resolve) => {
    var grant = Grant.koa()

    var app = new Koa()
    app.keys = ['grant']
    app.use(koasession(app))
    app.use(koabody())
    app.use(mount(grant(config)))
    koaqs(app)
    app.use(callback)

    var server = app.listen(port, () => resolve({grant, server, app}))
  }),
  nomount: (config, port) => new Promise((resolve) => {
    var grant = Grant.koa()

    var app = new Koa()
    app.keys = ['grant']
    app.use(koasession(app))
    app.use(koabody())
    app.use(grant(config))
    koaqs(app)
    app.use(callback)

    var server = app.listen(port, () => resolve({grant, server, app}))
  }),
}
