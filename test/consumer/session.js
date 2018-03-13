'use strict'

var t = require('assert')
var qs = require('qs')
var request = require('request')

var express = require('express')
var session = require('express-session')
var bodyParser = require('body-parser')

var Koa = require('koa')
var koasession = require('koa-session')
var koabody = require('koa-bodyparser')
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


describe('consumer - session', () => {
  var url = (path) =>
    `${config.server.protocol}://${config.server.host}${path}`

  var config = {
    server: {protocol: 'http', host: 'localhost:5000'},
    facebook: {}, twitter: {}
  }

  ;['express', 'koa', 'hapi'].forEach((name) => {
    describe(`oauth2 - ${name}`, () => {
      var server, grant, consumer = name

      var servers = {
        express: (done) => {
          grant = new Grant.express()(config)
          var app = express()
          app.use(bodyParser.urlencoded({extended: true}))
          app.use(session({secret: 'grant', saveUninitialized: true, resave: true}))
          app.use(grant)

          grant.config.facebook.authorize_url = '/authorize_url'
          grant.config.twitter.request_url = url('/request_url')
          grant.config.twitter.authorize_url = '/authorize_url'

          app.post('/request_url', (req, res) => {
            res.end(qs.stringify({oauth_token: 'token'}))
          })
          app.get('/authorize_url', (req, res) => {
            res.end(JSON.stringify(req.session.grant))
          })
          server = app.listen(5000, done)
        },
        koa: (done) => {
          grant = new Grant.koa()(config)

          var app = new Koa()
          app.keys = ['grant']
          app.use(koasession(app))
          app.use(koabody())
          app.use(mount(grant))
          koaqs(app)

          grant.config.facebook.authorize_url = '/authorize_url'
          grant.config.twitter.request_url = url('/request_url')
          grant.config.twitter.authorize_url = '/authorize_url'

          app.use(function* () {
            if (this.path === '/request_url') {
              this.body = qs.stringify({oauth_token: 'token'})
            }
            else if (this.path === '/authorize_url') {
              this.body = JSON.stringify(this.session.grant)
            }
          })

          server = app.listen(5000, done)
        },
        hapi: (done) => {
          grant = new Grant.hapi()()

          server = new Hapi.Server()
          server.connection({host: 'localhost', port: 5000})

          server.route({method: 'POST', path: '/request_url', handler: function (req, res) {
            res(qs.stringify({oauth_token: 'token'}))
          }})
          server.route({method: 'GET', path: '/authorize_url', handler: function (req, res) {
            res(JSON.stringify((req.session || req.yar).get('grant')))
          }})

          server.register([
            {register: grant, options: config},
            {register: yar, options: {cookieOptions: {password: '01234567890123456789012345678912', isSecure: false}}}
          ], function (err) {
            if (err) {
              done(err)
              return
            }

            grant.config.facebook.authorize_url = '/authorize_url'
            grant.config.twitter.request_url = url('/request_url')
            grant.config.twitter.authorize_url = '/authorize_url'

            server.start(done)
          })
        }
      }

      before((done) => {
        servers[consumer](done)
      })

      it('provider', (done) => {
        request.get(url('/connect/facebook'), {
          jar: request.jar(),
          json: true
        }, (err, res, body) => {
          t.deepEqual(body, {provider: 'facebook'})
          done()
        })
      })

      it('override', (done) => {
        request.get(url('/connect/facebook/contacts'), {
          jar: request.jar(),
          json: true
        }, (err, res, body) => {
          t.deepEqual(body, {provider: 'facebook', override: 'contacts'})
          done()
        })
      })

      it('dynamic - POST', (done) => {
        request.post(url('/connect/facebook/contacts'), {
          form: {scope: ['scope1', 'scope2'], state: 'Grant'},
          jar: request.jar(),
          followAllRedirects: true,
          json: true
        }, (err, res, body) => {
          t.deepEqual(body, {provider: 'facebook', override: 'contacts',
            dynamic: {scope: ['scope1', 'scope2'], state: 'Grant'}, state: 'Grant'})
          done()
        })
      })

      it('dynamic - GET', (done) => {
        request.get(url('/connect/facebook/contacts'), {
          qs: {scope: ['scope1', 'scope2'], state: 'Grant'},
          jar: request.jar(),
          followAllRedirects: true,
          json: true
        }, (err, res, body) => {
          t.deepEqual(body, {provider: 'facebook', override: 'contacts',
            dynamic: {scope: ['scope1', 'scope2'], state: 'Grant'}, state: 'Grant'})
          done()
        })
      })

      it('dynamic - non configured provider', (done) => {
        t.equal(grant.config.google, undefined)

        request.get(url('/connect/google'), {
          qs: {scope: ['scope1', 'scope2'], state: 'Grant',
            authorize_url: '/authorize_url'},
          jar: request.jar(),
          followAllRedirects: true,
          json: true
        }, (err, res, body) => {
          t.ok(typeof grant.config.google === 'object')
          t.deepEqual(body, {provider: 'google',
            dynamic: {scope: ['scope1', 'scope2'], state: 'Grant',
              authorize_url: '/authorize_url'}, state: 'Grant'})
          done()
        })
      })

      it('dynamic - non existing provider', (done) => {
        t.equal(grant.config.grant, undefined)

        request.get(url('/connect/grant'), {
          qs: {oauth: 2, authorize_url: '/authorize_url'},
          jar: request.jar(),
          followAllRedirects: true,
          json: true
        }, (err, res, body) => {
          t.equal(grant.config.grant, undefined)
          t.deepEqual(body, {provider: 'grant',
            dynamic: {oauth: '2', authorize_url: '/authorize_url'}})
          done()
        })
      })

      it('request', (done) => {
        request.get(url('/connect/twitter'), {
          jar: request.jar(),
          json: true
        }, (err, res, body) => {
          t.deepEqual(body, {provider: 'twitter', request: {oauth_token: 'token'}})
          done()
        })
      })

      it('state auto generated', (done) => {
        grant.config.facebook.state = true
        request.get(url('/connect/facebook'), {
          jar: request.jar(),
          followAllRedirects: true,
          json: true
        }, (err, res, body) => {
          t.ok(/\d+/.test(body.state))
          t.ok(typeof body.state === 'string')
          done()
        })
      })

      after((done) => {
        server[/express|koa/.test(consumer) ? 'close' : 'stop'](done)
      })
    })
  })
})
