
var t = require('assert')
var http = require('http')
var url = require('url')
var qs = require('qs')

var express = require('express')
var session = require('express-session')
var cookiesession = require('cookie-session')
var bodyParser = require('body-parser')

var Koa = require('koa')
var koasession = require('koa-session')
var koabody = require('koa-bodyparser')
var mount = require('koa-mount')
var koaqs = require('koa-qs')

try {
  var Hapi = require('@hapi/hapi')
  var yar = require('@hapi/yar')
}
catch (err) {
  var Hapi = require('hapi')
  var yar = require('yar')
}

var Grant = require('../../')
var Session = require('grant-session')

var version = {
  express: 4,
  koa: parseInt(require('koa/package.json').version.split('.')[0]),
  hapi: (() => {
    try {
      var pkg = require('@hapi/hapi/package.json')
    }
    catch (err) {
      var pkg = require('hapi/package.json')
    }
    return parseInt(pkg.version.split('.')[0])
  })()
}

var client = async ({test, handler, port = 5001, ...rest}) => {
  var _handler = () =>
    /koa/.test(handler) ? `${handler}${version.koa >= 2 ? '' : 1}` :
    /hapi/.test(handler) ? `${handler}${version.hapi >= 17 ? '' : 16}` :
    handler

  var {grant, server, app} = await clients[test][_handler()]({port, ...rest})
  return {
    grant,
    server,
    app,
    url: (path) => `http://localhost:${port}${path}`,
    close: () => new Promise((resolve) => {
      handler === 'hapi' && version.hapi >= 17
        ? server.stop().then(resolve)
        : server[/express|koa|node|aws|vercel/.test(handler) ? 'close' : 'stop'](resolve)
    })
  }
}

var clients = {
  'handlers': {
    express: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var grant =
        index === 0 ? Grant.express()(config) :
        index === 1 ? Grant.express()({config}) :
        index === 2 ? Grant.express(config) :
        index === 3 ? Grant.express({config}) :
        index === 4 ? Grant({config, handler: 'express'}) :
        Grant({config, request, state, extend, handler: 'express'})

      var app = express()
      app.use(bodyParser.urlencoded({extended: true}))
      app.use(session({secret: 'grant', saveUninitialized: true, resave: false}))
      app.use(grant)
      app.get('/', callback.express)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    koa: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var grant =
        index === 0 ? Grant.koa()(config) :
        index === 1 ? Grant.koa()({config}) :
        index === 2 ? Grant.koa(config) :
        index === 3 ? Grant.koa({config}) :
        index === 4 ? Grant({config, handler: 'koa'}) :
        Grant({config, request, state, extend, handler: 'koa'})

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(koabody())
      app.use(grant)
      koaqs(app)
      app.use(callback.koa)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    hapi: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var grant =
        index === 0 ? Grant.hapi()(config) :
        index === 1 ? Grant.hapi()({config}) :
        index === 2 ? Grant.hapi(config) :
        index === 3 ? Grant.hapi({config}) :
        index === 4 ? Grant({config, handler: 'hapi'}) :
        Grant({config, request, state, extend, handler: 'hapi'})

      var server = new Hapi.Server({host: 'localhost', port})
      server.route({method: 'GET', path: '/', handler: callback.hapi})

      server.register([
        {plugin: grant},
        {plugin: yar, options: {cookieOptions:
          {password: '01234567890123456789012345678912', isSecure: false}}}
      ])
      .then(() => server.start().then(() => resolve({grant, server})))
    }),
    node: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var grant =
        index === 0 ? Grant.node()(config) :
        index === 1 ? Grant.node()({config}) :
        index === 2 ? Grant.node(config) :
        index === 3 ? Grant.node({config}) :
        index === 4 ? Grant({config, handler: 'node'}) :
        Grant({config, request, state, extend, handler: 'node'})

      var db = {}
      var session = Session({
        handler: 'node',
        secret: 'grant',
        store: {
          get: async (key) => db[key],
          set: async (key, value) => db[key] = value,
          remove: async (key) => delete db[key],
        }
      })

      var server = http.createServer()
      server.on('request', async (req, res) => {
        var state = {} // dynamic state
        var _session = session(req, res)
        var resp = await grant(req, res, _session, state)
        if (resp && resp.state) {
          callback.node({req, res, session: await _session.get(), state})
        }
        else {
          if (/^\/(?:\?|$)/.test(req.url)) {
            callback.node({
              req, res,
              session: await _session.get(),
              query: qs.parse(req.url.split('?')[1])
            })
          }
          // not matching URL
          else {
            res.end()
          }
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    aws: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var grant =
        index === 0 ? Grant.aws()(config) :
        index === 1 ? Grant.aws()({config}) :
        index === 2 ? Grant.aws(config) :
        index === 3 ? Grant.aws({config}) :
        index === 4 ? Grant({config, handler: 'aws'}) :
        Grant({config, request, state, extend, handler: 'aws'})

      var db = {}
      var session = Session({
        handler: 'aws',
        secret: 'grant',
        store: {
          get: async (key) => db[key],
          set: async (key, value) => db[key] = value,
          remove: async (key) => delete db[key],
        }
      })

      var handler = async (req) => {
        var state = {} // dynamic state
        var _session = session(req)
        var res = await grant(req, _session, state)
        return res
          ? res.state ? callback.aws({session: await _session.get(), state: res.state}) : res
          : req.path === '/'
            ? callback.aws({session: await _session.get(), query: req.queryStringParameters})
            : {statusCode: 404, body: 'Not Found'}
      }

      var buffer = (req, body = []) => new Promise((resolve, reject) => req
        .on('data', (chunk) => body.push(chunk))
        .on('end', () => resolve(Buffer.concat(body).toString('utf8')))
        .on('error', reject)
      )

      var server = http.createServer()
      server.on('request', async (req, res) => {
        var event = {
          httpMethod: req.method,
          path: req.url.split('?')[0],
          queryStringParameters: qs.parse(req.url.split('?')[1]),
          headers: req.headers,
          body: await buffer(req),
        }
        var {statusCode, headers, body} = await handler(event)
        res.writeHead(statusCode, headers)
        res.end(JSON.stringify(body))
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    vercel: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var grant =
        index === 0 ? Grant.vercel()(config) :
        index === 1 ? Grant.vercel()({config}) :
        index === 2 ? Grant.vercel(config) :
        index === 3 ? Grant.vercel({config}) :
        index === 4 ? Grant({config, handler: 'vercel'}) :
        Grant({config, request, state, extend, handler: 'vercel'})

      var db = {}
      var session = Session({
        handler: 'vercel',
        secret: 'grant',
        store: {
          get: async (key) => db[key],
          set: async (key, value) => db[key] = value,
          remove: async (key) => delete db[key],
        }
      })

      var handler = async (req, res) => {
        var state = {} // dynamic state
        var _session = session(req, res)
        var resp = await grant(req, res, _session, state)
        if (resp && resp.state) {
          callback.vercel({req, res, session: await _session.get(), state: resp.state})
        }
        else {
          return 'not found'
        }
      }

      var buffer = (req, body = []) => new Promise((resolve, reject) => req
        .on('data', (chunk) => body.push(chunk))
        .on('end', () => resolve(Buffer.concat(body).toString('utf8')))
        .on('error', reject)
      )

      var server = http.createServer()
      server.on('request', async (req, res) => {
        req.query = req.url.split('?')[1]
        req.body = await buffer(req)
        var message = await handler(req, res)
        if (message === 'not found') {
          if (/^\/(?:\?|$)/.test(req.url)) {
            var _session = session(req, res)
            callback.vercel({
              req, res,
              session: await _session.get(),
              query: qs.parse(req.url.split('?')[1])
            })
          }
          // not matching URL
          else {
            res.end()
          }
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    koa1: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var grant =
        index === 0 ? Grant.koa()(config) :
        index === 1 ? Grant.koa()({config}) :
        index === 2 ? Grant.koa(config) :
        index === 3 ? Grant.koa({config}) :
        index === 4 ? Grant({config, handler: 'koa'}) :
        Grant({config, request, state, extend, handler: 'koa'})

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(koabody())
      app.use(grant)
      koaqs(app)
      app.use(callback.koa1)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    hapi16: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var grant =
        index === 0 ? Grant.hapi()(config) :
        index === 1 ? Grant.hapi()({config}) :
        index === 2 ? Grant.hapi(config) :
        index === 3 ? Grant.hapi({config}) :
        index === 4 ? Grant({config, handler: 'hapi'}) :
        Grant({config, request, state, extend, handler: 'hapi'})

      var server = new Hapi.Server()
      server.connection({host: 'localhost', port})
      server.route({method: 'GET', path: '/', handler: callback.hapi16})

      server.register([
        {register: grant},
        {register: yar, options: {cookieOptions:
          {password: '01234567890123456789012345678912', isSecure: false}}}
      ],
      () => server.start(() => resolve({grant, server})))
    }),
  },
  'missing-session': {
    express: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.express()(config)

      var app = express()
      app.use(grant)
      app.use((err, req, res, next) => {
        res.end(err.message)
      })

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    koa: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new Koa()
      app.use(async (ctx, next) => {
        try {
          await next()
        }
        catch (err) {
          ctx.body = err.message
        }
      })
      app.use(grant)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    hapi: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.hapi()(config)

      var server = new Hapi.Server({host: 'localhost', port})
      server.events.on('request', (event, tags) => {
        t.equal(tags.error.message, 'Grant: register session plugin first')
      })

      server.register([
        {plugin: grant}
      ])
      .then(() => server.start().then(() => resolve({grant, server})))
    }),
    koa1: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new Koa()
      app.use(function* (next) {
        try {
          yield next
        }
        catch (err) {
          this.body = err.message
        }
      })
      app.use(grant)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    hapi16: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.hapi()(config)

      var server = new Hapi.Server({debug: {request: false}})
      server.connection({host: 'localhost', port})

      server.register([
        {register: grant}
      ],
      () => {
        server.on('request-error', (req, err) => {
          t.equal(err.message, 'Uncaught error: Grant: register session plugin first')
        })
        server.start(() => resolve({grant, server}))
      })
    }),
  },
  'missing-parser': {
    express: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.express()(config)

      var app = express()
      app.use(session({secret: 'grant', saveUninitialized: true, resave: false}))
      app.use(grant)
      app.use((err, req, res, next) => {
        res.end(err.message)
      })

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    koa: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(async (ctx, next) => {
        try {
          await next()
        }
        catch (err) {
          ctx.body = err.message
        }
      })
      app.use(grant)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    koa1: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(function* (next) {
        try {
          yield next
        }
        catch (err) {
          this.body = err.message
        }
      })
      app.use(grant)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
  },
  'path-prefix': {
    express: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.express()(config)

      var app = express()
      app.use(bodyParser.urlencoded({extended: true}))
      app.use(session({secret: 'grant', saveUninitialized: true, resave: false}))
      app.use('/oauth', grant)
      app.get('/', callback.express)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    koa: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(koabody())
      app.use(mount('/oauth', grant))
      koaqs(app)
      app.use(callback.koa)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    hapi: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.hapi()(config)

      var server = new Hapi.Server({host: 'localhost', port})
      server.route({method: 'GET', path: '/', handler: callback.hapi})

      server.register([
        {routes: {prefix: '/oauth'}, plugin: grant},
        {plugin: yar, options: {cookieOptions:
          {password: '01234567890123456789012345678912', isSecure: false}}}
      ])
      .then(() => server.start().then(() => resolve({grant, server})))
    }),
    koa1: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(koabody())
      app.use(mount('/oauth', grant))
      koaqs(app)
      app.use(callback.koa1)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    hapi16: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.hapi()(config)

      var server = new Hapi.Server()
      server.connection({host: 'localhost', port})
      server.route({method: 'GET', path: '/', handler: callback.hapi16})

      server.register([
        {routes: {prefix: '/oauth'}, register: grant},
        {register: yar, options: {cookieOptions:
          {password: '01234567890123456789012345678912', isSecure: false}}}
      ],
      () => server.start(() => resolve({grant, server})))
    }),
  },
  'dynamic-state': {
    express: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.express()(config)

      var app = express()
      app.use(bodyParser.urlencoded({extended: true}))
      app.use(session({secret: 'grant', saveUninitialized: true, resave: false}))
      app.use((req, res, next) => {
        if (/^\/connect/.test(req.url)) {
          res.locals.grant = {dynamic: {key: 'very', secret: 'secret'}}
        }
        next()
      })
      app.use(grant)
      app.get('/', callback.express)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    koa: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(koabody())
      app.use(async (ctx, next) => {
        if (/^\/connect/.test(ctx.path)) {
          ctx.state.grant = {dynamic: {key: 'very', 'secret': 'secret'}}
        }
        await next()
      })
      app.use(grant)
      koaqs(app)
      app.use(callback.koa)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    hapi: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.hapi()(config)

      var server = new Hapi.Server({host: 'localhost', port})
      server.ext('onPreHandler', (req, res) => {
        if (/^\/connect/.test(req.path)) {
          req.plugins.grant = {dynamic: {key: 'very', 'secret': 'secret'}}
        }
        return res.continue
      })
      server.route({method: 'GET', path: '/', handler: callback.hapi})

      server.register([
        {plugin: grant},
        {plugin: yar, options: {cookieOptions:
          {password: '01234567890123456789012345678912', isSecure: false}}}
      ])
      .then(() => server.start().then(() => resolve({grant, server})))
    }),
    node: ({config, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'node'})

      var db = {}
      var session = Session({
        handler: 'node',
        secret: 'grant',
        store: {
          get: async (key) => db[key],
          set: async (key, value) => db[key] = value,
          remove: async (key) => delete db[key],
        }
      })

      var server = http.createServer()
      server.on('request', async (req, res) => {
        if (/^\/connect/.test(req.url)) {
          var state = {dynamic: {key: 'very', secret: 'secret'}}
        }
        var _session = session(req, res)
        var resp = await grant(req, res, _session, state)
        if (resp && resp.state) {
          callback.node({req, res, session: await _session.get(), state})
        }
        else {
          if (/^\/(?:\?|$)/.test(req.url)) {
            callback.node({
              req, res,
              session: await _session.get(),
              query: qs.parse(req.url.split('?')[1])
            })
          }
          // not matching URL
          else {
            res.end()
          }
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    aws: ({config, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'aws'})

      var db = {}
      var session = Session({
        handler: 'aws',
        secret: 'grant',
        store: {
          get: async (key) => db[key],
          set: async (key, value) => db[key] = value,
          remove: async (key) => delete db[key],
        }
      })

      var handler = async (req) => {
        if (/^\/connect/.test(req.path)) {
          var state = {dynamic: {key: 'very', secret: 'secret'}}
        }
        var _session = session(req)
        var res = await grant(req, _session, state)
        return res
          ? res.state ? callback.aws({session: await _session.get(), state: res.state}) : res
          : req.path === '/'
            ? callback.aws({session: await _session.get(), query: req.queryStringParameters})
            : {statusCode: 404, body: 'Not Found'}
      }

      var server = http.createServer()
      server.on('request', async (req, res) => {
        var event = {
          httpMethod: req.method,
          path: req.url.split('?')[0],
          queryStringParameters: qs.parse(req.url.split('?')[1]),
          headers: req.headers,
          body: '',
        }
        var {statusCode, headers, body} = await handler(event)
        res.writeHead(statusCode, headers)
        res.end(JSON.stringify(body))
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    vercel: ({config, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'vercel'})

      var db = {}
      var session = Session({
        handler: 'vercel',
        secret: 'grant',
        store: {
          get: async (key) => db[key],
          set: async (key, value) => db[key] = value,
          remove: async (key) => delete db[key],
        }
      })

      var handler = async (req, res) => {
        var state = {dynamic: {key: 'very', secret: 'secret'}}
        var _session = session(req, res)
        var resp = await grant(req, res, _session, state)
        if (resp && resp.state) {
          callback.vercel({req, res, session: await _session.get(), state: resp.state})
        }
        else {
          return 'not found'
        }
      }

      var server = http.createServer()
      server.on('request', async (req, res) => {
        req.query = req.url.split('?')[1]
        var message = await handler(req, res)
        if (message === 'not found') {
          if (/^\/(?:\?|$)/.test(req.url)) {
            var _session = session(req, res)
            callback.vercel({
              req, res,
              session: await _session.get(),
              query: qs.parse(req.url.split('?')[1])
            })
          }
          // not matching URL
          else {
            res.end()
          }
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    koa1: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(koabody())
      app.use(function* (next) {
        if (/^\/connect/.test(this.path)) {
          this.state.grant = {dynamic: {key: 'very', 'secret': 'secret'}}
        }
        yield next
      })
      app.use(grant)
      koaqs(app)
      app.use(callback.koa1)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    hapi16: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.hapi()(config)

      var server = new Hapi.Server()
      server.connection({host: 'localhost', port})
      server.ext('onPreHandler', (req, res) => {
        if (/^\/connect/.test(req.path)) {
          req.plugins.grant = {dynamic: {key: 'very', 'secret': 'secret'}}
        }
        res.continue()
      })
      server.route({method: 'GET', path: '/', handler: callback.hapi16})

      server.register([
        {register: grant},
        {register: yar, options: {cookieOptions:
          {password: '01234567890123456789012345678912', isSecure: false}}}
      ],
      () => server.start(() => resolve({grant, server})))
    }),
  },
  'transport-state': {
    express: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.express()(config)

      var app = express()
      app.use(bodyParser.urlencoded({extended: true}))
      app.use(session({secret: 'grant', saveUninitialized: true, resave: false}))
      app.use(grant)
      app.use(callback.express)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    koa: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(koabody())
      app.use(grant)
      koaqs(app)
      app.use(callback.koa)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    'koa-before': ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(koabody())
      app.use(callback['koa-before'])
      app.use(grant)
      koaqs(app)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    hapi: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.hapi()(config)

      var server = new Hapi.Server({host: 'localhost', port})
      server.ext('onPostHandler', (req, res) => {
        if (/\/callback$/.test(req.path)) {
          return callback.hapi(req, res)
        }
        return res.continue
      })

      server.register([
        {plugin: grant},
        {plugin: yar, options: {cookieOptions:
          {password: '01234567890123456789012345678912', isSecure: false}}}
      ])
      .then(() => server.start().then(() => resolve({grant, server})))
    }),
    node: ({config, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'node'})

      var db = {}
      var session = Session({
        handler: 'node',
        secret: 'grant',
        store: {
          get: async (key) => db[key],
          set: async (key, value) => db[key] = value,
          remove: async (key) => delete db[key],
        }
      })

      var server = http.createServer()
      server.on('request', async (req, res) => {
        var state = {} // dynamic state
        var _session = session(req, res)
        var resp = await grant(req, res, _session, state)
        if (resp && resp.state) {
          callback.node({req, res, session: await _session.get(), state: resp.state})
        }
        else {
          if (/^\/(?:\?|$)/.test(req.url)) {
            callback.node({
              req, res,
              session: await _session.get(),
              query: qs.parse(req.url.split('?')[1])
            })
          }
          // not matching URL
          else {
            res.end()
          }
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    aws: ({config, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'aws'})

      var db = {}
      var session = Session({
        handler: 'aws',
        secret: 'grant',
        store: {
          get: async (key) => db[key],
          set: async (key, value) => db[key] = value,
          remove: async (key) => delete db[key],
        }
      })

      var handler = async (req) => {
        var state = {} // dynamic state
        var _session = session(req)
        var res = await grant(req, _session, state)
        return res
          ? res.state ? callback.aws({session: await _session.get(), state: res.state}) : res
          : req.path === '/'
            ? callback.aws({session: await _session.get(), query: req.queryStringParameters})
            : {statusCode: 404, body: 'Not Found'}
      }

      var server = http.createServer()
      server.on('request', async (req, res) => {
        var event = {
          httpMethod: req.method,
          path: req.url.split('?')[0],
          queryStringParameters: qs.parse(req.url.split('?')[1]),
          headers: req.headers,
          body: '',
        }
        var {statusCode, headers, body} = await handler(event)
        res.writeHead(statusCode, headers)
        res.end(JSON.stringify(body))
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    vercel: ({config, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'vercel'})

      var db = {}
      var session = Session({
        handler: 'vercel',
        secret: 'grant',
        store: {
          get: async (key) => db[key],
          set: async (key, value) => db[key] = value,
          remove: async (key) => delete db[key],
        }
      })

      var handler = async (req, res) => {
        var state = {} // dynamic
        var _session = session(req, res)
        var resp = await grant(req, res, _session, state)
        if (resp && resp.state) {
          callback.vercel({req, res, session: await _session.get(), state: resp.state})
        }
        else {
          return 'not found'
        }
      }

      var server = http.createServer()
      server.on('request', async (req, res) => {
        req.query = req.url.split('?')[1]
        var message = await handler(req, res)
        if (message === 'not found') {
          if (/^\/(?:\?|$)/.test(req.url)) {
            var _session = session(req, res)
            callback.vercel({
              req, res,
              session: await _session.get(),
              query: qs.parse(req.url.split('?')[1])
            })
          }
          // not matching URL
          else {
            res.end()
          }
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    koa1: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(koabody())
      app.use(grant)
      koaqs(app)
      app.use(callback.koa1)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    'koa-before1': ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(koabody())
      app.use(callback['koa-before1'])
      app.use(grant)
      koaqs(app)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    hapi16: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.hapi()(config)

      var server = new Hapi.Server()
      server.connection({host: 'localhost', port})
      server.ext('onPostHandler', (req, res) => {
        if (/\/callback$/.test(req.path)) {
          callback.hapi(req, res)
          return
        }
        res.continue()
      })

      server.register([
        {register: grant},
        {register: yar, options: {cookieOptions:
          {password: '01234567890123456789012345678912', isSecure: false}}}
      ],
      () => server.start(() => resolve({grant, server})))
    }),
  },
  'cookie-store': {
    express: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.express()(config)

      var app = express()
      app.use(bodyParser.urlencoded({extended: true}))
      app.use(cookiesession({signed: true, secret: 'grant', maxAge: 60 * 1000}))
      app.use(grant)
      app.get('/', callback.express)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    node: ({config, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'node'})

      var session = Session({
        handler: 'node',
        secret: 'grant',
        embed: true
      })

      var server = http.createServer()
      server.on('request', async (req, res) => {
        var state = {} // dynamic state
        var _session = session(req, res)
        var resp = await grant(req, res, _session, state)
        if (resp && resp.state) {
          callback.node({req, res, session: await _session.get(), state})
        }
        else {
          if (/^\/(?:\?|$)/.test(req.url)) {
            callback.node({
              req, res,
              session: await _session.get(),
              query: qs.parse(req.url.split('?')[1])
            })
          }
          // not matching URL
          else {
            res.end()
          }
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    aws: ({config, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'aws'})

      var session = Session({
        handler: 'aws',
        secret: 'grant',
        embed: true
      })

      var handler = async (req) => {
        var state = {} // dynamic state
        var _session = session(req)
        var res = await grant(req, _session, state)
        return res
          ? res.state ? callback.aws({session: await _session.get(), state: res.state}) : res
          : req.path === '/'
            ? callback.aws({session: await _session.get(), query: req.queryStringParameters})
            : {statusCode: 404, body: 'Not Found'}
      }

      var buffer = (req, body = []) => new Promise((resolve, reject) => req
        .on('data', (chunk) => body.push(chunk))
        .on('end', () => resolve(Buffer.concat(body).toString('utf8')))
        .on('error', reject)
      )

      var server = http.createServer()
      server.on('request', async (req, res) => {
        var event = {
          httpMethod: req.method,
          path: req.url.split('?')[0],
          queryStringParameters: qs.parse(req.url.split('?')[1]),
          headers: req.headers,
          body: await buffer(req),
        }
        var {statusCode, headers, body} = await handler(event)
        res.writeHead(statusCode, headers)
        res.end(JSON.stringify(body))
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    vercel: ({config, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'vercel'})

      var db = {}
      var session = Session({
        handler: 'vercel',
        secret: 'grant',
        embed: true,
      })

      var handler = async (req, res) => {
        var state = {} // dynamic
        var _session = session(req, res)
        var resp = await grant(req, res, _session, state)
        if (resp && resp.state) {
          callback.vercel({req, res, session: await _session.get(), state: resp.state})
        }
        else {
          return 'not found'
        }
      }

      var server = http.createServer()
      server.on('request', async (req, res) => {
        req.query = req.url.split('?')[1]
        var message = await handler(req, res)
        if (message === 'not found') {
          if (/^\/(?:\?|$)/.test(req.url)) {
            var _session = session(req, res)
            callback.vercel({
              req, res,
              session: await _session.get(),
              query: qs.parse(req.url.split('?')[1])
            })
          }
          // not matching URL
          else {
            res.end()
          }
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
  },
  'third-party': {
    'koa-mount': ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(koabody())
      app.use(mount(grant))
      koaqs(app)
      app.use(callback.koa)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    'koa-mount1': ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(koabody())
      app.use(mount(grant))
      koaqs(app)
      app.use(callback.koa1)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
  },
}

var callback = {
  express: (req, res) => {
    res.writeHead(200, {'content-type': 'application/json'})
    res.end(JSON.stringify({
      session: req.session.grant,
      response: (res.locals.grant || {}).response || req.session.grant.response || req.query,
      state: res.locals.grant,
    }))
  },
  koa: (ctx) => {
    if (ctx.path === '/' || /\/callback$/.test(ctx.path)) {
      ctx.response.status = 200
      ctx.set('content-type', 'application/json')
      ctx.body = JSON.stringify({
        session: ctx.session.grant,
        response: (ctx.state.grant || {}).response || ctx.session.grant.response || ctx.request.query,
        state: ctx.state.grant,
      })
    }
  },
  hapi: (req, res) => {
    var query = qs.parse(req.query)
    return res.response({
      session: req.yar.get('grant'),
      response: (req.plugins.grant || {}).response || req.yar.get('grant').response || query,
      state: req.plugins.grant,
    })
  },
  node: ({req, res, session, query, state = {}}) => {
    res.writeHead(200, {'content-type': 'application/json'})
    res.end(JSON.stringify({
      session: session.grant,
      response: (state.grant || {}).response || session.grant.response || query,
      state: state.grant,
    }))
  },
  aws: ({session, query, state = {}}) => {
    return {
      statusCode: 200,
      headers: {'content-type': 'application/json'},
      body: {
        session: session.grant,
        response: (state.grant || {}).response || session.grant.response || query,
        state: state.grant,
      }
    }
  },
  vercel: ({req, res, session, query, state = {}}) => {
    res.writeHead(200, {'content-type': 'application/json'})
    res.end(JSON.stringify({
      session: session.grant,
      response: (state.grant || {}).response || session.grant.response || query,
      state: state.grant,
    }))
  },
  'koa-before': async (ctx, next) => {
    await next()
    if (ctx.path === '/' || /\/callback$/.test(ctx.path)) {
      ctx.response.status = 200
      ctx.set('content-type', 'application/json')
      ctx.body = JSON.stringify({
        session: ctx.session.grant,
        response: (ctx.state.grant || {}).response || ctx.session.grant.response || ctx.request.query,
        state: ctx.state.grant,
      })
    }
  },
  koa1: function* () {
    if (this.path === '/' || /\/callback$/.test(this.path)) {
      this.response.status = 200
      this.set('content-type', 'application/json')
      this.body = JSON.stringify({
        session: this.session.grant,
        response: (this.state.grant || {}).response || this.session.grant.response || this.request.query,
        state: this.state.grant,
      })
    }
  },
  'koa-before1': function* (next) {
    yield next
    if (this.path === '/' || /\/callback$/.test(this.path)) {
      this.response.status = 200
      this.set('content-type', 'application/json')
      this.body = JSON.stringify({
        session: this.session.grant,
        response: (this.state.grant || {}).response || this.session.grant.response || this.request.query,
        state: this.state.grant,
      })
    }
  },
  hapi16: (req, res) => {
    var parsed = url.parse(req.url, false)
    var query = qs.parse(parsed.query)
    res({
      session: (req.session || req.yar).get('grant'),
      response: (req.plugins.grant || {}).response || (req.session || req.yar).get('grant').response || query,
      state: req.plugins.grant,
    })
  },
}

module.exports = client
