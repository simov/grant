'use strict'

var request = require('request')
  , should = require('should')
  , qs = require('qs')
var koa = require('koa')
  , session = require('koa-session')
  , route = require('koa-route')
  , mount = require('koa-mount')
  , koaqs = require('koa-qs')
var Grant = require('../../../').koa()


describe('flow - koa', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var config = {
    server: {protocol:'http', host:'localhost:5000', callback:'/'},
    facebook:{}, getpocket:{}, twitter:{}
  }
  var server, grant

  describe('oauth1', function () {
    before(function (done) {
      grant = new Grant(config)

      var app = koa()
      app.keys = ['grant']
      app.use(session(app))
      app.use(mount(grant))
      koaqs(app)

      grant.config.twitter.request_url = url('/request_url')
      grant.config.twitter.authorize_url = url('/authorize_url')
      grant.config.twitter.access_url = url('/access_url')

      app.use(route.post('/request_url', function* (next) {
        this.body = qs.stringify({oauth_token:'token', oauth_token_secret:'secret'})
      }))
      app.use(route.get('/authorize_url', function* (next) {
        this.response.redirect(url('/connect/twitter/callback?' + qs.stringify({
          oauth_token:'token', oauth_verifier:'verifier'
        })))
      }))
      app.use(route.post('/access_url', function* (next) {
        this.body = JSON.stringify({
          oauth_token:'token', oauth_token_secret:'secret'
        })
      }))
      app.use(route.get('/', function* (next) {
        this.body = JSON.stringify(this.session.grant.response || this.request.query)
      }))

      server = app.listen(5000, done)
    })

    it('twitter', function (done) {
      function assert (done) {
        request.get(url('/connect/twitter'), {
          jar:request.jar(),
          json:true
        }, function (err, res, body) {
          should.deepEqual(body, {
            access_token:'token', access_secret:'secret',
            raw: {oauth_token:'token', oauth_token_secret:'secret'}
          })
          done()
        })
      }
      grant.config.twitter.transport = 'querystring'
      assert(function () {
        grant.config.twitter.transport = 'session'
        assert(done)
      })
    })

    after(function (done) {
      server.close(done)
    })
  })

  describe('oauth2', function () {
    before(function (done) {
      var grant = new Grant(config)

      var app = koa()
      app.keys = ['grant']
      app.use(session(app))
      app.use(mount(grant))
      koaqs(app)

      grant.config.facebook.authorize_url = url('/authorize_url')
      grant.config.facebook.access_url = url('/access_url')

      app.use(route.get('/authorize_url', function* (next) {
        this.response.redirect(url('/connect/facebook/callback?code=code'))
      }))
      app.use(route.post('/access_url', function* (next) {
        this.body = JSON.stringify({
          access_token:'token', refresh_token:'refresh', expires_in:3600
        })
      }))
      app.use(route.get('/', function* (next) {
        this.body = JSON.stringify(this.request.query)
      }))

      server = app.listen(5000, done)
    })

    it('facebook', function (done) {
      request.get(url('/connect/facebook'), {
        jar:request.jar(),
        json:true
      }, function (err, res, body) {
        should.deepEqual(body, {
          access_token:'token', refresh_token:'refresh',
          raw: {access_token:'token', refresh_token:'refresh', expires_in:'3600'}
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

      var app = koa()
      app.keys = ['grant']
      app.use(session(app))
      app.use(mount(grant))
      koaqs(app)

      grant.config.getpocket.request_url = url('/request_url')
      grant.config.getpocket.authorize_url = url('/authorize_url')
      grant.config.getpocket.access_url = url('/access_url')

      app.use(route.post('/request_url', function* (next) {
        this.body = qs.stringify({code:'code'})
      }))
      app.use(route.get('/authorize_url', function* (next) {
        this.response.redirect(url('/connect/getpocket/callback?' + qs.stringify({
          request_token:'token'
        })))
      }))
      app.use(route.post('/access_url', function* (next) {
        this.body = JSON.stringify({
          access_token:'token', username:'grant'
        })
      }))
      app.use(route.get('/', function* (next) {
        this.body = JSON.stringify(this.request.query)
      }))

      server = app.listen(5000, done)
    })

    it('getpocket', function (done) {
      request.get(url('/connect/getpocket'), {
        jar:request.jar(),
        json:true
      }, function (err, res, body) {
        should.deepEqual(body, {
          access_token:'token',
          raw: {access_token:'token', username:'grant'}
        })
        done()
      })
    })

    after(function (done) {
      server.close(done)
    })
  })
})
