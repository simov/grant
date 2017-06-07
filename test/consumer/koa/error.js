'use strict'

var t = require('assert')
var qs = require('qs')
var request = require('request')
var Koa = require('koa')
var session = require('koa-session')
var mount = require('koa-mount')
var convert = require('koa-convert')
var koaqs = require('koa-qs')
var Grant = require('../../../').koa()


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

describe('error - koa', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var config = {
    server: {protocol: 'http', host: 'localhost:5000', callback: '/'},
    facebook: {}
  }

  describe('missing middleware', function () {
    describe('session', function () {
      var server
      before(function (done) {
        var grant = new Grant(config)
        var app = new Koa()
        app.use(function* (next) {
          try {
            yield next
          }
          catch (err) {
            t.equal(err.message, 'Grant: mount session middleware first')
          }
        })
        app.use(mount(grant))
        server = app.listen(5000, done)
      })

      it('', function (done) {
        request.get(url('/connect/facebook'), {
          jar: request.jar(),
          json: true
        }, function (err, res, body) {
          body.match(/Error: Grant: mount session middleware first/)
          done()
        })
      })

      after(function (done) {
        server.close(done)
      })
    })

    describe('body-parser', function () {
      var server
      before(function (done) {
        var grant = new Grant(config)
        var app = new Koa()
        app.keys = ['grant']
        app.use(session(app))
        app.use(function* (next) {
          try {
            yield next
          }
          catch (err) {
            t.equal(err.message, 'Grant: mount body parser middleware first')
          }
        })
        app.use(mount(grant))
        server = app.listen(5000, done)
      })

      it('', function (done) {
        request.post(url('/connect/facebook'), {
          jar: request.jar(),
          json: true
        }, function (err, res, body) {
          body.match(/Error: Grant: mount body parser middleware first/)
          done()
        })
      })

      after(function (done) {
        server.close(done)
      })
    })
  })

  describe('oauth2', function () {
    describe('step1 - missing code', function () {
      var server
      before(function (done) {
        var grant = new Grant(config)

        var app = new Koa()
        app.keys = ['grant']
        app.use(session(app))
        app.use(mount(grant))
        koaqs(app)

        grant.config.facebook.authorize_url = url('/authorize_url')

        app.use(function* () {
          if (this.path === '/authorize_url') {
            this.response.redirect(url('/connect/facebook/callback?' +
              qs.stringify({error: {message: 'invalid', code: 500}})))
          }
          else if (this.path === '/') {
            this.body = JSON.stringify(this.request.query)
          }
        })

        server = app.listen(5000, done)
      })

      it('authorize', function (done) {
        request.get(url('/connect/facebook'), {
          jar: request.jar(),
          json: true
        }, function (err, res, body) {
          t.deepEqual(body, {error: {error: {message: 'invalid', code: '500'}}})
          done()
        })
      })

      after(function (done) {
        server.close(done)
      })
    })

    describe('step1 - state mismatch', function () {
      var server
      before(function (done) {
        var grant = new Grant(config)

        var app = new Koa()
        app.keys = ['grant']
        app.use(session(app))
        app.use(mount(grant))
        koaqs(app)

        grant.config.facebook.authorize_url = url('/authorize_url')
        grant.config.facebook.state = 'Grant'

        app.use(function* () {
          if (this.path === '/authorize_url') {
            this.response.redirect(url('/connect/facebook/callback?' +
              qs.stringify({code: 'code', state: 'Purest'})))
          }
          else if (this.path === '/') {
            this.body = JSON.stringify(this.request.query)
          }
        })

        server = app.listen(5000, done)
      })

      it('authorize', function (done) {
        request.get(url('/connect/facebook'), {
          jar: request.jar(),
          json: true
        }, function (err, res, body) {
          t.deepEqual(body, {error: {error: 'Grant: OAuth2 state mismatch'}})
          done()
        })
      })

      after(function (done) {
        server.close(done)
      })
    })

    describe('step2 - error response', function () {
      var server
      before(function (done) {
        var grant = new Grant(config)

        var app = new Koa()
        app.keys = ['grant']
        app.use(session(app))
        app.use(mount(grant))
        koaqs(app)

        grant.config.facebook.authorize_url = url('/authorize_url')
        grant.config.facebook.access_url = url('/access_url')

        app.use(function* () {
          if (this.path === '/authorize_url') {
            this.response.redirect(url('/connect/facebook/callback?code=code'))
          }
          else if (this.path === '/access_url') {
            this.response.status = 500
            this.body = qs.stringify({error: {message: 'invalid', code: 500}})
          }
          else if (this.path === '/') {
            this.body = JSON.stringify(this.request.query)
          }
        })

        server = app.listen(5000, done)
      })

      it('access', function (done) {
        request.get(url('/connect/facebook'), {
          jar: request.jar(),
          json: true
        }, function (err, res, body) {
          t.deepEqual(body, {error: {error: {message: 'invalid', code: '500'}}})
          done()
        })
      })

      after(function (done) {
        server.close(done)
      })
    })
  })

  describe('missing provider', function () {
    var grant, server, jar = request.jar()
    before(function (done) {
      grant = new Grant(config)
      var app = new Koa()
      app.keys = ['grant']
      app.use(session(app))
      app.use(mount(grant))
      koaqs(app)

      app.use(function* () {
        if (this.path === '/') {
          this.response.set('x-test', true)
          this.body = JSON.stringify(this.request.query)
        }
      })

      server = app.listen(5000, done)
    })

    it('connect', function (done) {
      delete grant.config.facebook.oauth
      request.get(url('/connect/facebook'), {
        jar: jar,
        json: true
      }, function (err, res, body) {
        t.equal(res.headers['x-test'], 'true')
        t.deepEqual(body, {
          error: 'Grant: missing or misconfigured provider'})
        done()
      })
    })
    it('connect - no callback', function (done) {
      delete grant.config.facebook.callback
      request.get(url('/connect/facebook'), {
        jar: jar,
        json: true
      }, function (err, res, body) {
        t.equal(res.headers['x-test'], undefined)
        t.deepEqual(qs.parse(body), {
          error: 'Grant: missing or misconfigured provider'})
        done()
      })
    })

    it('callback', function (done) {
      grant.config.facebook.callback = '/'
      request.get(url('/connect/facebook/callback'), {
        jar: jar,
        json: true
      }, function (err, res, body) {
        t.equal(res.headers['x-test'], 'true')
        t.deepEqual(body, {
          error: 'Grant: missing session or misconfigured provider'})
        done()
      })
    })
    it('callback - no callback', function (done) {
      delete grant.config.facebook.callback
      request.get(url('/connect/facebook/callback'), {
        jar: jar,
        json: true
      }, function (err, res, body) {
        t.equal(res.headers['x-test'], undefined)
        t.deepEqual(qs.parse(body), {
          error: 'Grant: missing session or misconfigured provider'})
        done()
      })
    })

    after(function (done) {
      server.close(done)
    })
  })
})
