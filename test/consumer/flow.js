
var t = require('assert')
var urlib = require('url')
var http = require('http')
var qs = require('qs')

var request = require('request-compose').extend({
  Request: {cookie: require('request-cookie').Request},
  Response: {cookie: require('request-cookie').Response},
}).client

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
var hapi = parseInt(require('hapi/package.json').version.split('.')[0])

var port = {auth: 5000, app: 5001}
var url = {
  auth: (path) => `http://localhost:${port.auth}${path}`,
  app: (path) => `http://localhost:${port.app}${path}`,
}


describe('consumer - flow', () => {

  describe('oauth1', () => {
    var server

    before((done) => {
      server = http.createServer()
      server.on('request', (req, res) => {
        if (/^\/request_url/.test(req.url)) {
          res.writeHead(200, {'content-type': 'application/x-www-form-urlencoded'})
          res.end(qs.stringify({oauth_token: 'token', oauth_token_secret: 'secret'}))
        }
        else if (/^\/authorize_url/.test(req.url)) {
          var location = url.app('/connect/twitter/callback') + '?' +
            qs.stringify({oauth_token: 'token', oauth_verifier: 'verifier'})
          res.writeHead(302, {location})
          res.end()
        }
        else if (/^\/access_url/.test(req.url)) {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end(JSON.stringify({
            oauth_token: 'token', oauth_token_secret: 'secret'
          }))
        }
      })
      server.listen(port.auth, done)
    })

    ;['express', 'koa', 'hapi'].forEach((name) => {
      describe(name, () => {
        var server, grant, consumer = name
        var config = {
          defaults: {callback: '/'},
          grant: {
            request_url: url.auth('/request_url'),
            authorize_url: url.auth('/authorize_url'),
            access_url: url.auth('/access_url'),
            oauth: 1,
          }
        }

        var servers = {
          express: (done) => {
            grant = Grant.express()(config)
            var app = express()
            app.use(session({secret: 'grant', saveUninitialized: true, resave: true}))
            app.use(grant)

            app.get('/', (req, res) => {
              res.writeHead(200, {'content-type': 'application/json'})
              res.end(JSON.stringify(req.session.grant.response || req.query))
            })
            server = app.listen(port.app, done)
          },
          koa: (done) => {
            grant = Grant.koa()(config)

            var app = new Koa()
            app.keys = ['grant']
            app.use(koasession(app))
            app.use(mount(grant))
            koaqs(app)

            app.use(function* () {
              if (this.path === '/') {
                this.response.status = 200
                this.set('content-type', 'application/json')
                this.body = JSON.stringify(this.session.grant.response || this.request.query)
              }
            })

            server = app.listen(port.app, done)
          },
          hapi: (done) => {
            grant = Grant.hapi()()

            server = new Hapi.Server()
            server.connection({host: 'localhost', port: port.app})

            server.route({method: 'GET', path: '/', handler: (req, res) => {
              var parsed = urlib.parse(req.url, false)
              var query = qs.parse(parsed.query)
              res((req.session || req.yar).get('grant').response || query)
            }})

            server.register([
              {register: grant, options: config},
              {register: yar, options: {cookieOptions: {
                password: '01234567890123456789012345678912', isSecure: false}}}
            ], (err) => {
              if (err) {
                done(err)
                return
              }

              server.start(done)
            })
          },
          hapi17: (done) => {
            grant = Grant.hapi()()
            server = new Hapi.Server({host: 'localhost', port: port.app})

            server.route({method: 'GET', path: '/', handler: (req, res) => {
              var parsed = urlib.parse(req.url, false)
              var query = qs.parse(parsed.query)
              return res.response((req.session || req.yar).get('grant').response || query)
            }})

            server.register([
              {plugin: grant, options: config},
              {plugin: yar, options: {cookieOptions: {
                password: '01234567890123456789012345678912', isSecure: false}}}
            ])
              .then(() => {
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

        it('flow', async () => {
          var assert = async (message) => {
            var {body} = await request({
              url: url.app('/connect/grant'),
              cookie: {},
            })
            t.deepEqual(body, {
              access_token: 'token', access_secret: 'secret',
              raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
            }, message)
          }
          delete grant.config.grant.transport
          await assert('no transport')
          grant.config.grant.transport = 'querystring'
          await assert('querystring transport')
          grant.config.grant.transport = 'session'
          await assert('session transport')
        })

        after((done) => {
          consumer === 'hapi' && hapi >= 17
            ? server.stop().then(done)
            : server[/express|koa/.test(consumer) ? 'close' : 'stop'](done)
        })
      })
    })

    after((done) => {
      server.close(done)
    })
  })

  describe('oauth2', () => {
    var server

    before((done) => {
      server = http.createServer()
      server.on('request', (req, res) => {
        if (/^\/authorize_url/.test(req.url)) {
          var location = url.app('/connect/twitter/callback') + '?' +
            qs.stringify({code: 'code'})
          res.writeHead(302, {location})
          res.end()
        }
        else if (/^\/access_url/.test(req.url)) {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end(JSON.stringify({
            access_token: 'token', refresh_token: 'refresh', expires_in: 3600
          }))
        }
      })
      server.listen(port.auth, done)
    })

    ;['express', 'koa', 'hapi'].forEach((name) => {
      describe(name, () => {
        var server, grant, consumer = name
        var config = {
          defaults: {callback: '/'},
          grant: {
            authorize_url: url.auth('/authorize_url'),
            access_url: url.auth('/access_url'),
            oauth: 2,
          }
        }

        var servers = {
          express: (done) => {
            grant = Grant.express()(config)
            var app = express()
            app.use(session({secret: 'grant', saveUninitialized: true, resave: true}))
            app.use(grant)

            app.get('/', (req, res) => {
              res.writeHead(200, {'content-type': 'application/json'})
              res.end(JSON.stringify(req.session.grant.response || req.query))
            })
            server = app.listen(port.app, done)
          },
          koa: (done) => {
            grant = Grant.koa()(config)

            var app = new Koa()
            app.keys = ['grant']
            app.use(koasession(app))
            app.use(mount(grant))
            koaqs(app)

            app.use(function* () {
              if (this.path === '/') {
                this.response.status = 200
                this.set('content-type', 'application/json')
                this.body = JSON.stringify(this.session.grant.response || this.request.query)
              }
            })

            server = app.listen(port.app, done)
          },
          hapi: (done) => {
            grant = Grant.hapi()()

            server = new Hapi.Server()
            server.connection({host: 'localhost', port: port.app})

            server.route({method: 'GET', path: '/', handler: (req, res) => {
              var parsed = urlib.parse(req.url, false)
              var query = qs.parse(parsed.query)
              res((req.session || req.yar).get('grant').response || query)
            }})

            server.register([
              {register: grant, options: config},
              {register: yar, options: {cookieOptions: {password: '01234567890123456789012345678912', isSecure: false}}}
            ], (err) => {
              if (err) {
                done(err)
                return
              }

              server.start(done)
            })
          },
          hapi17: (done) => {
            grant = Grant.hapi()()
            server = new Hapi.Server({host: 'localhost', port: port.app})

            server.route({method: 'GET', path: '/', handler: (req, res) => {
              var parsed = urlib.parse(req.url, false)
              var query = qs.parse(parsed.query)
              return res.response((req.session || req.yar).get('grant').response || query)
            }})

            server.register([
              {plugin: grant, options: config},
              {plugin: yar, options: {cookieOptions: {password: '01234567890123456789012345678912', isSecure: false}}}
            ])
              .then(() => {
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

        it('flow', async () => {
          var assert = async (message) => {
            var {body} = await request({
              url: url.app('/connect/grant'),
              cookie: {},
            })
            t.deepEqual(body, {
              access_token: 'token', refresh_token: 'refresh',
              raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
            }, message)
          }
          delete grant.config.grant.transport
          await assert('no transport')
          grant.config.grant.transport = 'querystring'
          await assert('querystring transport')
          grant.config.grant.transport = 'session'
          await assert('session transport')
        })

        after((done) => {
          consumer === 'hapi' && hapi >= 17
            ? server.stop().then(done)
            : server[/express|koa/.test(consumer) ? 'close' : 'stop'](done)
        })
      })
    })

    after((done) => {
      server.close(done)
    })
  })

})
