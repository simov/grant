
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

var sign = (...args) => args.map((arg, index) => index < 2
  ? Buffer.from(JSON.stringify(arg)).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  : arg).join('.')

var port = {auth: 5000, app: 5001}
var url = {
  auth: (path) => `http://localhost:${port.auth}${path}`,
  app: (path) => `http://localhost:${port.app}${path}`,
}


describe('consumer - error', () => {

  describe('missing session middleware', () => {
    ;['express', 'koa', 'hapi'].forEach((name) => {
      describe(name, () => {
        var server, consumer = name, config = {}

        var servers = {
          express: (done) => {
            var grant = Grant.express()(config)
            var app = express().use(grant)
            app.use((err, req, res, next) => {
              t.equal(err.message, 'Grant: mount session middleware first')
              next()
            })
            server = app.listen(port.app, done)
          },
          koa: (done) => {
            var grant = Grant.koa()(config)
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
            server = app.listen(port.app, done)
          },
          hapi: (done) => {
            var grant = Grant.hapi()()
            server = new Hapi.Server({debug: {request: false}})
            server.connection({host: 'localhost', port: port.app})

            server.register([{register: grant, options: config}], (err) => {
              if (err) {
                done(err)
                return
              }

              server.on('request-error', (req, err) => {
                t.equal(err.message, 'Uncaught error: Grant: register session plugin first')
              })

              server.start(done)
            })
          },
          hapi17: (done) => {
            var grant = Grant.hapi()()
            server = new Hapi.Server({host: 'localhost', port: port.app})

            server.events.on('request', (event, tags) => {
              t.equal(tags.error.message, 'Grant: register session plugin first')
            })

            server.register([
              {plugin: grant, options: config}
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

        it('throw', async () => {
          try {
            await request({
              url: url.app('/connect/grant'),
              cookie: {},
            })
          }
          catch (err) {}
        })

        after((done) => {
          consumer === 'hapi' && hapi >= 17
            ? server.stop().then(done)
            : server[/express|koa/.test(consumer) ? 'close' : 'stop'](done)
        })
      })
    })
  })

  describe('missing body-parser middleware', () => {
    ;['express', 'koa'].forEach((name) => {
      describe(name, () => {
        var server, consumer = name, config = {}

        var servers = {
          express: (done) => {
            var grant = Grant.express()(config)
            var app = express()
            app.use(session({secret: 'grant', saveUninitialized: true, resave: true}))
            app.use(grant)
            app.use((err, req, res, next) => {
              t.equal(err.message, 'Grant: mount body parser middleware first')
              next()
            })
            server = app.listen(port.app, done)
          },
          koa: (done) => {
            var grant = Grant.koa()(config)
            var app = new Koa()
            app.keys = ['grant']
            app.use(koasession(app))
            app.use(function* (next) {
              try {
                yield next
              }
              catch (err) {
                t.equal(err.message, 'Grant: mount body parser middleware first')
              }
            })
            app.use(mount(grant))
            server = app.listen(port.app, done)
          }
        }

        before((done) => {
          servers[
            consumer === 'hapi' ? `${consumer}${hapi < 17 ? '' : '17'}` : consumer
          ](done)
        })

        it('throw', async () => {
          try {
            await request({
              method: 'POST',
              url: url.app('/connect/grant'),
              cookie: {},
            })
          }
          catch (err) {}
        })

        after((done) => {
          consumer === 'hapi' && hapi >= 17
            ? server.stop().then(done)
            : server[/express|koa/.test(consumer) ? 'close' : 'stop'](done)
        })
      })
    })
  })

  describe('oauth2 - authorize - missing code + response message', () => {
    var server

    before((done) => {
      server = http.createServer()
      server.on('request', (req, res) => {
        if (/^\/authorize_url/.test(req.url)) {
          var location = url.app('/connect/grant/callback') + '?' +
            qs.stringify({error: {message: 'invalid', code: '500'}})
          res.writeHead(302, {location})
          res.end()
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
              res.json(req.session.grant.response || req.query)
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
              var query = qs.parse(req.query)
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

        it('authorize', async () => {
          var assert = async (message) => {
            var {body} = await request({
              url: url.app('/connect/grant'),
              cookie: {},
            })
            t.deepEqual(
              body,
              {error: {error: {message: 'invalid', code: '500'}}},
              message
            )
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

  describe('oauth2 - authorize - missing code without response message', () => {
    var server

    before((done) => {
      server = http.createServer()
      server.on('request', (req, res) => {
        if (/^\/authorize_url/.test(req.url)) {
          var location = url.app('/connect/grant/callback')
          res.writeHead(302, {location})
          res.end()
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
              res.json(req.session.grant.response || req.query)
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
              var query = qs.parse(req.query)
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

        it('authorize', async () => {
          var assert = async (message) => {
            var {body} = await request({
              url: url.app('/connect/grant'),
              cookie: {},
            })
            t.deepEqual(
              body,
              {error: {error: 'Grant: OAuth2 missing code parameter'}},
              message
            )
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

  describe('oauth2 - authorize - state mismatch', () => {
    var server

    before((done) => {
      server = http.createServer()
      server.on('request', (req, res) => {
        if (/^\/authorize_url/.test(req.url)) {
          var location = url.app('/connect/grant/callback') + '?' +
            qs.stringify({code: 'code', state: 'Purest'})
          res.writeHead(302, {location})
          res.end()
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
            oauth: 2,
            state: 'Grant',
          }
        }

        var servers = {
          express: (done) => {
            grant = Grant.express()(config)
            var app = express()
            app.use(session({secret: 'grant', saveUninitialized: true, resave: true}))
            app.use(grant)

            app.get('/', (req, res) => {
              res.json(req.session.grant.response || req.query)
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
              var query = qs.parse(req.query)
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

        it('authorize', async () => {
          var assert = async (message) => {
            var {body} = await request({
              url: url.app('/connect/grant'),
              cookie: {},
            })
            t.deepEqual(
              body,
              {error: {error: 'Grant: OAuth2 state mismatch'}},
              message
            )
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

  describe('oauth2 - authorize - nonce mismatch', () => {
    var server

    before((done) => {
      server = http.createServer()
      server.on('request', (req, res) => {
        if (/^\/authorize_url/.test(req.url)) {
          var location = url.app('/connect/grant/callback') + '?' +
            qs.stringify({code: 'code'})
          res.writeHead(302, {location})
          res.end()
        }
        else if (/^\/access_url/.test(req.url)) {
          res.writeHead(200, {'content-type': 'application/x-www-form-urlencoded'})
          res.end(qs.stringify({id_token: sign({typ: 'JWT'}, {nonce: 'Purest'}, 'signature')}))
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
            nonce: 'Grant',
          }
        }

        var servers = {
          express: (done) => {
            grant = Grant.express()(config)
            var app = express()
            app.use(session({secret: 'grant', saveUninitialized: true, resave: true}))
            app.use(grant)

            app.get('/', (req, res) => {
              res.json(req.session.grant.response || req.query)
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
              var query = qs.parse(req.query)
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

        it('authorize', async () => {
          var assert = async (message) => {
            var {body} = await request({
              url: url.app('/connect/grant'),
              cookie: {},
            })
            t.deepEqual(
              body,
              {error: 'Grant: OpenID Connect nonce mismatch'},
              message
            )
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

  describe('oauth2 - access - error response', () => {
    var server

    before((done) => {
      server = http.createServer()
      server.on('request', (req, res) => {
        if (/^\/authorize_url/.test(req.url)) {
          var location = url.app('/connect/grant/callback') + '?' +
            qs.stringify({code: 'code'})
          res.writeHead(302, {location})
          res.end()
        }
        else if (/^\/access_url/.test(req.url)) {
          res.writeHead(500, {'content-type': 'application/x-www-form-urlencoded'})
          res.end(qs.stringify({error: {message: 'invalid', code: '500'}}))
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
              res.json(req.session.grant.response || req.query)
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
              var query = qs.parse(req.query)
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

        it('access', async () => {
          var assert = async (message) => {
            var {body} = await request({
              url: url.app('/connect/grant'),
              cookie: {},
            })
            t.deepEqual(
              body,
              {error: {error: {message: 'invalid', code: '500'}}},
              message
            )
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

  describe('missing session or misconfigured provider', () => {
    ;['express', 'koa', 'hapi'].forEach((name) => {
      describe(name, () => {
        var server, grant, consumer = name
        var config = {
          grant: {}
        }

        var servers = {
          express: (done) => {
            grant = Grant.express()(config)
            var app = express()
            app.use(session({secret: 'grant', saveUninitialized: true, resave: true}))
            app.use(grant)

            app.get('/', (req, res) => {
              res.setHeader('x-test', true)
              res.json(req.session.grant.response || req.query)
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
                this.response.set('x-test', true)
                this.response.set('content-type', 'application/json')
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
              res((req.session || req.yar).get('grant').response || query).header('x-test', true)
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
              var query = qs.parse(req.query)
              return res.response((req.session || req.yar).get('grant').response || query)
                .header('x-test', true)
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

        it('/connect - misconfigured provider - with callback', async () => {
          grant.config.grant.callback = '/'
          var assert = async (message) => {
            var {res, body} = await request({
              url: url.app('/connect/grant'),
              cookie: {},
            })
            t.equal(res.headers['x-test'], 'true')
            t.deepEqual(
              body,
              {error: 'Grant: missing or misconfigured provider'},
              message
            )
          }
          delete grant.config.grant.transport
          await assert('no transport')
          grant.config.grant.transport = 'querystring'
          await assert('querystring transport')
          grant.config.grant.transport = 'session'
          await assert('session transport')
        })

        it('/connect - misconfigured provider - no callback', async () => {
          delete grant.config.grant.callback
          var {res, body} = await request({
            url: url.app('/connect/grant'),
            cookie: {},
          })
          t.equal(res.headers['x-test'], undefined)
          t.deepEqual(qs.parse(body), {
            error: 'Grant: missing or misconfigured provider'
          })
        })

        it('/connect - missing provider - non preconfigured no dynamic', async () => {
          var {res, body} = await request({
            url: url.app('/connect/purest'),
            cookie: {},
          })
          t.deepEqual(
            qs.parse(body),
            {error: 'Grant: missing or misconfigured provider'},
            'message'
          )
        })

        it('/callback - missing session', async () => {
          var {res, body} = await request({
            url: url.app('/connect/grant/callback'),
            cookie: {},
          })
          t.equal(res.headers['x-test'], undefined)
          t.deepEqual(qs.parse(body), {
            error: 'Grant: missing session or misconfigured provider'
          })
        })

        after((done) => {
          consumer === 'hapi' && hapi >= 17
            ? server.stop().then(done)
            : server[/express|koa/.test(consumer) ? 'close' : 'stop'](done)
        })
      })
    })
  })

})
