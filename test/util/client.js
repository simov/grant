
var t = require('assert')
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

var client = async ({test, handler, config, hook, extend, port = 5001}) => {
  var _handler = () =>
    /koa/.test(handler) ? `${handler}${version.koa >= 2 ? '' : 1}` :
    /hapi/.test(handler) ? `${handler}${version.hapi >= 17 ? '' : 16}` :
    handler

  var {grant, server, app} = await clients[test][_handler()]({config, hook, extend, port})
  return {
    grant,
    server,
    app,
    url: (path) => `http://localhost:${port}${path}`,
    close: () => new Promise((resolve) => {
      handler === 'hapi' && version.hapi >= 17
        ? server.stop().then(resolve)
        : server[/express|koa/.test(handler) ? 'close' : 'stop'](resolve)
    })
  }
}

var clients = {
  'handlers': {
    express: ({config, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'express'})

      var app = express()
      app.use(bodyParser.urlencoded({extended: true}))
      app.use(session({secret: 'grant', saveUninitialized: true, resave: false}))
      app.use(grant)
      app.get('/', callback.express)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    koa: ({config, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'koa'})

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(koabody())
      app.use(grant)
      koaqs(app)
      app.use(callback.koa)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    hapi: ({config, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'hapi'})

      var server = new Hapi.Server({host: 'localhost', port})
      server.route({method: 'GET', path: '/', handler: callback.hapi})

      server.register([
        {plugin: grant},
        {plugin: yar, options: {cookieOptions:
          {password: '01234567890123456789012345678912', isSecure: false}}}
      ])
      .then(() => server.start().then(() => resolve({grant, server})))
    }),
    koa1: ({config, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'koa'})

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(koabody())
      app.use(grant)
      koaqs(app)
      app.use(callback.koa1)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    hapi16: ({config, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'hapi'})

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
  'handlers-function': {
    express: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.express()(config)

      var app = express()
      app.use(bodyParser.urlencoded({extended: true}))
      app.use(session({secret: 'grant', saveUninitialized: true, resave: false}))
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
      app.use(grant)
      koaqs(app)
      app.use(callback.koa)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    hapi: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.hapi()(config)

      var server = new Hapi.Server({host: 'localhost', port})
      server.route({method: 'GET', path: '/', handler: callback.hapi})

      server.register([
        {plugin: grant},
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
      app.use(grant)
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
  'third-party': {
    'express-cookie': ({config, port}) => new Promise((resolve) => {
      var grant = Grant.express()(config)

      var app = express()
      app.use(bodyParser.urlencoded({extended: true}))
      app.use(cookiesession({signed: true, secret: 'grant', maxAge: 60 * 1000}))
      app.use(grant)
      app.get('/', callback.express)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
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
  'extend-hook': {
    express: ({config, hook, extend, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'express', hook, extend})

      var app = express()
      app.use(bodyParser.urlencoded({extended: true}))
      app.use(session({secret: 'grant', saveUninitialized: true, resave: false}))
      app.use(grant)
      app.get('/', callback.express)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    koa: ({config, hook, extend, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'koa', hook, extend})

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(koabody())
      app.use(grant)
      koaqs(app)
      app.use(callback.koa)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    hapi: ({config, hook, extend, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'hapi', hook, extend})

      var server = new Hapi.Server({host: 'localhost', port})
      server.route({method: 'GET', path: '/', handler: callback.hapi})

      server.register([
        {plugin: grant},
        {plugin: yar, options: {cookieOptions:
          {password: '01234567890123456789012345678912', isSecure: false}}}
      ])
      .then(() => server.start().then(() => resolve({grant, server})))
    }),
    koa1: ({config, hook, extend, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'koa', hook, extend})

      var app = new Koa()
      app.keys = ['grant']
      app.use(koasession(app))
      app.use(koabody())
      app.use(grant)
      koaqs(app)
      app.use(callback.koa1)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    hapi16: ({config, hook, extend, port}) => new Promise((resolve) => {
      var grant = Grant({config, handler: 'hapi', hook, extend})

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
