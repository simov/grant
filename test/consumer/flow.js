'use strict'

var t = require('assert')
var qs = require('qs')
var request = require('request')
var urlib = require('url')

var express = require('express')
var session = require('express-session')

var Koa = require('koa')
var koasession = require('koa-session')
var mount = require('koa-mount')
var convert = require('koa-convert')
var koaqs = require('koa-qs')

var Hapi = require('hapi')
var yar = require('yar')

var Grant = require('../../')

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


describe('consumer - flow', () => {
  var url = (path) =>
    `${config.server.protocol}://${config.server.host}${path}`

  var config = {
    server: {protocol: 'http', host: 'localhost:5000', callback: '/'},
    facebook: {}, getpocket: {}, twitter: {}
  }

  ;['express', 'koa', 'hapi'].forEach((name) => {
    describe(`oauth1 - ${name}`, () => {
      var server, grant, consumer = name

      var servers = {
        express: (done) => {
          grant = new Grant.express()(config)
          var app = express()
          app.use(session({secret: 'grant', saveUninitialized: true, resave: true}))
          app.use(grant)

          grant.config.twitter.request_url = url('/request_url')
          grant.config.twitter.authorize_url = url('/authorize_url')
          grant.config.twitter.access_url = url('/access_url')

          app.post('/request_url', (req, res) => {
            res.end(qs.stringify({oauth_token: 'token', oauth_token_secret: 'secret'}))
          })
          app.get('/authorize_url', (req, res) => {
            res.redirect(url('/connect/twitter/callback?' + qs.stringify({
              oauth_token: 'token', oauth_verifier: 'verifier'
            })))
          })
          app.post('/access_url', (req, res) => {
            res.end(JSON.stringify({
              oauth_token: 'token', oauth_token_secret: 'secret'
            }))
          })
          app.get('/', (req, res) => {
            res.end(JSON.stringify(req.session.grant.response || req.query))
          })
          server = app.listen(5000, done)
        },
        koa: (done) => {
          grant = new Grant.koa()(config)

          var app = new Koa()
          app.keys = ['grant']
          app.use(koasession(app))
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
        },
        hapi: (done) => {
          grant = new Grant.hapi()()

          server = new Hapi.Server()
          server.connection({host: 'localhost', port: 5000})

          server.route({method: 'POST', path: '/request_url', handler: function (req, res) {
            res(qs.stringify({oauth_token: 'token', oauth_token_secret: 'secret'}))
          }})
          server.route({method: 'GET', path: '/authorize_url', handler: function (req, res) {
            res.redirect(url('/connect/twitter/callback?' + qs.stringify({
              oauth_token: 'token', oauth_verifier: 'verifier'
            })))
          }})
          server.route({method: 'POST', path: '/access_url', handler: function (req, res) {
            res({oauth_token: 'token', oauth_token_secret: 'secret'})
          }})
          server.route({method: 'GET', path: '/', handler: function (req, res) {
            var parsed = urlib.parse(req.url, false)
            var query = qs.parse(parsed.query)
            res((req.session || req.yar).get('grant').response || query)
          }})

          server.register([
            {register: grant, options: config},
            {register: yar, options: {cookieOptions: {
              password: '01234567890123456789012345678912', isSecure: false}}}
          ], function (err) {
            if (err) {
              done(err)
              return
            }

            grant.config.twitter.request_url = url('/request_url')
            grant.config.twitter.authorize_url = url('/authorize_url')
            grant.config.twitter.access_url = url('/access_url')

            server.start(done)
          })
        }
      }

      before((done) => {
        servers[consumer](done)
      })

      it('twitter', (done) => {
        var assert = (message, done) => {
          request.get(url('/connect/twitter'), {
            jar: request.jar(),
            json: true
          }, (err, res, body) => {
            t.deepEqual(body, {
              access_token: 'token', access_secret: 'secret',
              raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
            }, message)
            done()
          })
        }
        delete grant.config.twitter.transport
        assert('no transport', () => {
          grant.config.twitter.transport = 'querystring'
          assert('querystring transport', () => {
            grant.config.twitter.transport = 'session'
            assert('session transport', done)
          })
        })
      })

      after((done) => {
        server[/express|koa/.test(consumer) ? 'close' : 'stop'](done)
      })

    })
  })

  ;['express', 'koa', 'hapi'].forEach((name) => {
    describe(`oauth2 - ${name}`, () => {
      var server, grant, consumer = name

      var servers = {
        express: (done) => {
          grant = new Grant.express()(config)
          var app = express()
          app.use(session({secret: 'grant', saveUninitialized: true, resave: true}))
          app.use(grant)

          grant.config.facebook.authorize_url = url('/authorize_url')
          grant.config.facebook.access_url = url('/access_url')

          app.get('/authorize_url', function (req, res) {
            res.redirect(url('/connect/facebook/callback?code=code'))
          })
          app.post('/access_url', function (req, res) {
            res.end(JSON.stringify({
              access_token: 'token', refresh_token: 'refresh', expires_in: 3600
            }))
          })
          app.get('/', function (req, res) {
            res.end(JSON.stringify(req.session.grant.response || req.query))
          })
          server = app.listen(5000, done)
        },
        koa: (done) => {
          grant = new Grant.koa()(config)

          var app = new Koa()
          app.keys = ['grant']
          app.use(koasession(app))
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
              this.body = JSON.stringify(this.session.grant.response || this.request.query)
            }
          })

          server = app.listen(5000, done)
        },
        hapi: (done) => {
          grant = new Grant.hapi()()

          server = new Hapi.Server()
          server.connection({host: 'localhost', port: 5000})

          server.route({method: 'GET', path: '/authorize_url', handler: function (req, res) {
            res.redirect(url('/connect/facebook/callback?code=code'))
          }})
          server.route({method: 'POST', path: '/access_url', handler: function (req, res) {
            res(JSON.stringify({
              access_token: 'token', refresh_token: 'refresh', expires_in: 3600
            }))
          }})
          server.route({method: 'GET', path: '/', handler: function (req, res) {
            var parsed = urlib.parse(req.url, false)
            var query = qs.parse(parsed.query)
            res((req.session || req.yar).get('grant').response || query)
          }})

          server.register([
            {register: grant, options: config},
            {register: yar, options: {cookieOptions: {password: '01234567890123456789012345678912', isSecure: false}}}
          ], function (err) {
            if (err) {
              done(err)
              return
            }

            grant.config.facebook.authorize_url = url('/authorize_url')
            grant.config.facebook.access_url = url('/access_url')

            server.start(done)
          })
        }
      }

      before((done) => {
        servers[consumer](done)
      })

      it('facebook', (done) => {
        var assert = (message, done) => {
          request.get(url('/connect/facebook'), {
            jar: request.jar(),
            json: true
          }, (err, res, body) => {
            t.deepEqual(
              body, {
                access_token: 'token', refresh_token: 'refresh',
                raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
              }, message)
            done()
          })
        }
        delete grant.config.facebook.transport
        assert('no transport', () => {
          grant.config.facebook.transport = 'querystring'
          assert('querystring transport', () => {
            grant.config.facebook.transport = 'session'
            assert('session transport', done)
          })
        })
      })

      after((done) => {
        server[/express|koa/.test(consumer) ? 'close' : 'stop'](done)
      })
    })
  })
})
