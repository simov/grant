
var t = require('assert')
var qs = require('qs')
var request = require('request-compose').extend({
  Request: {cookie: require('request-cookie').Request},
  Response: {cookie: require('request-cookie').Response},
}).client

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
var hapi = parseInt(require('hapi/package.json').version.split('.')[0])


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
          grant = Grant.express()(config)
          var app = express()
          app.use(bodyParser.urlencoded({extended: true}))
          app.use(session({secret: 'grant', saveUninitialized: true, resave: true}))
          app.use(grant)

          grant.config.facebook.authorize_url = '/authorize_url'
          grant.config.twitter.request_url = url('/request_url')
          grant.config.twitter.authorize_url = '/authorize_url'

          app.post('/request_url', (req, res) => {
            res.writeHead(200, {'content-type': 'application/x-www-form-urlencoded'})
            res.end(qs.stringify({oauth_token: 'token'}))
          })
          app.get('/authorize_url', (req, res) => {
            res.writeHead(200, {'content-type': 'application/json'})
            res.end(JSON.stringify(req.session.grant))
          })
          server = app.listen(5000, done)
        },
        koa: (done) => {
          grant = Grant.koa()(config)

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
              this.response.status = 200
              this.set('content-type', 'application/x-www-form-urlencoded')
              this.body = qs.stringify({oauth_token: 'token'})
            }
            else if (this.path === '/authorize_url') {
              this.response.status = 200
              this.set('content-type', 'application/json')
              this.body = JSON.stringify(this.session.grant)
            }
          })

          server = app.listen(5000, done)
        },
        hapi: (done) => {
          grant = Grant.hapi()()

          server = new Hapi.Server()
          server.connection({host: 'localhost', port: 5000})

          server.route({method: 'POST', path: '/request_url', handler: (req, res) => {
            res(qs.stringify({oauth_token: 'token'}))
              .code(200)
              .header('content-type', 'application/x-www-form-urlencoded')
          }})
          server.route({method: 'GET', path: '/authorize_url', handler: (req, res) => {
            res((req.session || req.yar).get('grant'))
          }})

          server.register([
            {register: grant, options: config},
            {register: yar, options: {cookieOptions: {password: '01234567890123456789012345678912', isSecure: false}}}
          ], (err) => {
            if (err) {
              done(err)
              return
            }

            grant.config.facebook.authorize_url = '/authorize_url'
            grant.config.twitter.request_url = url('/request_url')
            grant.config.twitter.authorize_url = '/authorize_url'

            server.start(done)
          })
        },
        hapi17: (done) => {
          grant = Grant.hapi()()
          server = new Hapi.Server({host: 'localhost', port: 5000})

          server.route({method: 'POST', path: '/request_url', handler: (req, res) => {
            return res.response(qs.stringify({oauth_token: 'token'}))
              .code(200)
              .header('content-type', 'application/x-www-form-urlencoded')
          }})
          server.route({method: 'GET', path: '/authorize_url', handler: (req, res) => {
            return res.response(JSON.stringify((req.session || req.yar).get('grant')))
              .code(200)
              .header('content-type', 'application/json')
          }})

          server.register([
            {plugin: grant, options: config},
            {plugin: yar, options: {cookieOptions: {password: '01234567890123456789012345678912', isSecure: false}}}
          ])
            .then(() => {
              grant.config.facebook.authorize_url = '/authorize_url'
              grant.config.twitter.request_url = url('/request_url')
              grant.config.twitter.authorize_url = '/authorize_url'

              server.start().then(done).catch(done)
            })
            .catch(done)
        }
      }

      before((done) => {
        servers[
          consumer === 'hapi' ? `${consumer}${hapi < 17 ? '' : '17'}` : consumer
        ](done)
      })

      it('provider', async () => {
        var {body} = await request({
          url: url('/connect/facebook'),
          cookie: {},
        })
        t.deepEqual(body, {provider: 'facebook'})
      })

      it('override', async () => {
        var {body} = await request({
          url: url('/connect/facebook/contacts'),
          cookie: {},
        })
        t.deepEqual(body, {provider: 'facebook', override: 'contacts'})
      })

      it('dynamic - POST', async () => {
        var {body} = await request({
          method: 'POST',
          url: url('/connect/facebook/contacts'),
          form: {scope: ['scope1', 'scope2'], state: 'Grant', nonce: 'simov'},
          cookie: {},
          redirect: {all: true, method: false},
        })
        t.deepEqual(body, {provider: 'facebook', override: 'contacts',
          dynamic: {scope: ['scope1', 'scope2'], state: 'Grant', nonce: 'simov'},
          state: 'Grant', nonce: 'simov'
        })
      })

      it('dynamic - GET', async () => {
        var {body} = await request({
          url: url('/connect/facebook/contacts'),
          qs: {scope: ['scope1', 'scope2'], state: 'Grant', nonce: 'simov'},
          cookie: {},
        })
        t.deepEqual(body, {provider: 'facebook', override: 'contacts',
          dynamic: {scope: ['scope1', 'scope2'], state: 'Grant', nonce: 'simov'},
          state: 'Grant', nonce: 'simov'
        })
      })

      it('dynamic - non configured provider', async () => {
        t.equal(grant.config.google, undefined)

        var {body} = await request({
          url: url('/connect/google'),
          qs: {
            scope: ['scope1', 'scope2'], state: 'Grant', nonce: 'simov',
            authorize_url: '/authorize_url'
          },
          cookie: {},
        })
        t.ok(typeof grant.config.google === 'object')
        t.deepEqual(body, {provider: 'google',
          dynamic: {scope: ['scope1', 'scope2'], state: 'Grant', nonce: 'simov',
            authorize_url: '/authorize_url'}, state: 'Grant', nonce: 'simov'})
      })

      it('dynamic - non existing provider', async () => {
        t.equal(grant.config.grant, undefined)

        var {body} = await request({
          url: url('/connect/grant'),
          qs: {oauth: 2, authorize_url: '/authorize_url'},
          cookie: {},
        })
        t.equal(grant.config.grant, undefined)
        t.deepEqual(body, {provider: 'grant',
          dynamic: {oauth: '2', authorize_url: '/authorize_url'}})
      })

      it('request', async () => {
        var {body} = await request({
          url: url('/connect/twitter'),
          cookie: {},
        })
        t.deepEqual(body, {provider: 'twitter', request: {oauth_token: 'token'}})
      })

      it('auto generated state and nonce', async () => {
        grant.config.facebook.state = true
        grant.config.facebook.nonce = true
        var {body} = await request({
          url: url('/connect/facebook'),
          cookie: {},
        })
        t.ok(/\d+/.test(body.state))
        t.ok(typeof body.state === 'string')
        t.ok(/\d+/.test(body.nonce))
        t.ok(typeof body.nonce === 'string')
      })

      after((done) => {
        consumer === 'hapi' && hapi >= 17
          ? server.stop().then(done)
          : server[/express|koa/.test(consumer) ? 'close' : 'stop'](done)
      })
    })
  })
})
