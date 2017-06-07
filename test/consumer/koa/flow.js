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

describe('flow - koa', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var config = {
    server: {protocol: 'http', host: 'localhost:5000', callback: '/'},
    facebook: {}, getpocket: {}, twitter: {}
  }
  var server, grant

  describe('oauth1', function () {
    before(function (done) {
      grant = new Grant(config)

      var app = new Koa()
      app.keys = ['grant']
      app.use(session(app))
      app.use(mount(grant))
      koaqs(app)

      grant.config.twitter.request_url = url('/request_url')
      grant.config.twitter.authorize_url = url('/authorize_url')
      grant.config.twitter.access_url = url('/access_url')

      app.use(function* () {
        if (this.path === '/request_url') {
          this.body = qs.stringify({oauth_token: 'token', oauth_token_secret: 'secret'})
        }
        else if (this.path === '/authorize_url') {
          this.response.redirect(url('/connect/twitter/callback?' +
            qs.stringify({oauth_token: 'token', oauth_verifier: 'verifier'})))
        }
        else if (this.path === '/access_url') {
          this.body = JSON.stringify({
            oauth_token: 'token', oauth_token_secret: 'secret'
          })
        }
        else if (this.path === '/') {
          this.body = JSON.stringify(this.session.grant.response || this.request.query)
        }
      })

      server = app.listen(5000, done)
    })

    it('twitter', function (done) {
      function test (done) {
        request.get(url('/connect/twitter'), {
          jar: request.jar(),
          json: true
        }, function (err, res, body) {
          t.deepEqual(body, {
            access_token: 'token', access_secret: 'secret',
            raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
          })
          done()
        })
      }
      grant.config.twitter.transport = 'querystring'
      test(function () {
        grant.config.twitter.transport = 'session'
        test(done)
      })
    })

    after(function (done) {
      server.close(done)
    })
  })

  describe('oauth2', function () {
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
          this.body = JSON.stringify({
            access_token: 'token', refresh_token: 'refresh', expires_in: 3600
          })
        }
        else if (this.path === '/') {
          this.body = JSON.stringify(this.request.query)
        }
      })

      server = app.listen(5000, done)
    })

    it('facebook', function (done) {
      request.get(url('/connect/facebook'), {
        jar: request.jar(),
        json: true
      }, function (err, res, body) {
        t.deepEqual(body, {
          access_token: 'token', refresh_token: 'refresh',
          raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
        })
        done()
      })
    })

    after(function (done) {
      server.close(done)
    })
  })

  describe('custom', function () {
    before(function (done) {
      var grant = new Grant(config)

      var app = new Koa()
      app.keys = ['grant']
      app.use(session(app))
      app.use(mount(grant))
      koaqs(app)

      grant.config.getpocket.request_url = url('/request_url')
      grant.config.getpocket.authorize_url = url('/authorize_url')
      grant.config.getpocket.access_url = url('/access_url')

      app.use(function* () {
        if (this.path === '/request_url') {
          this.body = qs.stringify({code: 'code'})
        }
        else if (this.path === '/authorize_url') {
          this.response.redirect(url('/connect/getpocket/callback?' +
            qs.stringify({request_token: 'token'})))
        }
        else if (this.path === '/access_url') {
          this.body = JSON.stringify({
            access_token: 'token', username: 'grant'
          })
        }
        else if (this.path === '/') {
          this.body = JSON.stringify(this.request.query)
        }
      })

      server = app.listen(5000, done)
    })

    it('getpocket', function (done) {
      request.get(url('/connect/getpocket'), {
        jar: request.jar(),
        json: true
      }, function (err, res, body) {
        t.deepEqual(body, {
          access_token: 'token',
          raw: {access_token: 'token', username: 'grant'}
        })
        done()
      })
    })

    after(function (done) {
      server.close(done)
    })
  })
})
