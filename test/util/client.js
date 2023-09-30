
var t = require('assert')
var http = require('http')
var url = require('url')
var qs = require('qs')
var cookie = require('cookie')

var express = () => require('express')()
express.session = require('express-session')
express.cookie = require('cookie-session')
express.parser = require('body-parser')

var koa = require('koa')
koa.session = require('koa-session')
koa.parser = require('koa-bodyparser')
koa.mount = require('koa-mount')
koa.qs = require('koa-qs')

try {
  var hapi = require('@hapi/hapi')
  hapi.session = require('@hapi/yar')
}
catch (err) {
  var hapi = require('hapi')
  hapi.session = require('yar')
}

var fastify = require('fastify')
fastify.session = require('@fastify/session')
try {
  fastify.cookie = require('@fastify/cookie')
  fastify.parser = require('@fastify/formbody')
}
catch (err) {
  fastify.cookie = require('fastify-cookie')
  fastify.parser = require('fastify-formbody')
}

var {Application:curveball} = require('@curveball/core')
curveball.router = require('@curveball/router').default
curveball.parser = require('@curveball/bodyparser').default
curveball.session = require('@curveball/session').default

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

var client = async ({test, handler, port = 5001, ...rest}) => {
  var _handler = () =>
    /koa/.test(handler) ? `${handler}${version.koa >= 2 ? '' : 1}` :
    /hapi/.test(handler) ? `${handler}${version.hapi >= 17 ? '' : 16}` :
    handler

  var {grant, server} = await clients[test][_handler()]({port, ...rest})
  return {
    grant,
    server,
    url: (path) => `http://localhost:${port}${path}`,
    close: () => new Promise((resolve) => {
      handler === 'hapi' ? version.hapi >= 17
        ? server.stop().then(resolve) : server.stop(resolve)
        : server.close(resolve)
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

      var server = express()
        .use(express.parser.urlencoded({extended: true}))
        .use(express.session({secret: 'grant', saveUninitialized: true, resave: false}))
        .use(grant)
        .get('/', callback.express)
        .listen(port, () => resolve({grant, server}))
    }),
    koa: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var grant =
        index === 0 ? Grant.koa()(config) :
        index === 1 ? Grant.koa()({config}) :
        index === 2 ? Grant.koa(config) :
        index === 3 ? Grant.koa({config}) :
        index === 4 ? Grant({config, handler: 'koa'}) :
        Grant({config, request, state, extend, handler: 'koa'})

      var app = new koa()
      app.keys = ['grant']

      var server = app
        .use(koa.session(app))
        .use(koa.parser())
        .use(grant)
        .use(callback.koa)
        .listen(port, () => resolve({grant, server}))
    }),
    hapi: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var grant =
        index === 0 ? Grant.hapi()(config) :
        index === 1 ? Grant.hapi()({config}) :
        index === 2 ? Grant.hapi(config) :
        index === 3 ? Grant.hapi({config}) :
        index === 4 ? Grant({config, handler: 'hapi'}) :
        Grant({config, request, state, extend, handler: 'hapi'})

      var server = new hapi.Server({host: 'localhost', port})
      server.route({method: 'GET', path: '/', handler: callback.hapi})

      server.register([
        {plugin: grant},
        {plugin: hapi.session, options: {cookieOptions:
          {password: '01234567890123456789012345678912', isSecure: false}}}
      ])
      .then(() => server.start().then(() => resolve({grant, server})))
    }),
    fastify: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var grant =
        index === 0 ? Grant.fastify()(config) :
        index === 1 ? Grant.fastify()({config}) :
        index === 2 ? Grant.fastify(config) :
        index === 3 ? Grant.fastify({config}) :
        index === 4 ? Grant({config, handler: 'fastify'}) :
        Grant({config, request, state, extend, handler: 'fastify'})

      var server = fastify()
      server
        .register(fastify.cookie)
        .register(fastify.session, {
          secret: '01234567890123456789012345678912', cookie: {secure: false}})
        .register(fastify.parser)
        .register(grant)
        .route({method: 'GET', path: '/', handler: callback.fastify})
        .listen({port})
        .then(() => resolve({grant, server}))
    }),
    curveball: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var grant =
        index === 0 ? Grant.curveball()(config) :
        index === 1 ? Grant.curveball()({config}) :
        index === 2 ? Grant.curveball(config) :
        index === 3 ? Grant.curveball({config}) :
        index === 4 ? Grant({config, handler: 'curveball'}) :
        Grant({config, request, state, extend, handler: 'curveball'})

      var timeout, _setTimeout = global.setTimeout
      global.setTimeout = (cb, interval) => {
        timeout = _setTimeout(cb, interval)
      }

      var app = new curveball()
      app.use(curveball.session({store: 'memory'}))
      app.use(curveball.parser())
      app.use(grant)
      app.use(curveball.router('/', callback.curveball))
      var server = app.listen(port)
      resolve({grant, server})

      server.on('close', () => {
        clearTimeout(timeout)
        global.setTimeout = _setTimeout
      })
    }),
    node: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var db = {}
      var session = {
        secret: 'grant',
        store: {
          get: async (key) => db[key],
          set: async (key, value) => db[key] = value,
          remove: async (key) => delete db[key],
        }
      }

      var grant =
        index === 1 ? Grant.node()({config, session}) :
        index === 3 ? Grant.node({config, session}) :
        index === 4 ? Grant({config, session, handler: 'node'}) :
        Grant({config, session, request, state, extend, handler: 'node'})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        var {session, response, redirect} = await grant(req, res)
        if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
        else if (!redirect) {
          res.statusCode = 404
          res.end('Not Found')
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    aws: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var db = {}
      var session = {
        secret: 'grant',
        store: {
          get: async (key) => db[key],
          set: async (key, value) => db[key] = value,
          remove: async (key) => delete db[key],
        }
      }
      var grant =
        index === 1 ? Grant.aws()({config, session}) :
        index === 3 ? Grant.aws({config, session}) :
        index === 4 ? Grant({config, session, handler: 'aws'}) :
        Grant({config, session, request, state, extend, handler: 'aws'})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // aws
        var event = {
          httpMethod: req.method,
          requestContext: {path: req.url.split('?')[0]},
          queryStringParameters: qs.parse(req.url.split('?')[1]),
          headers: req.headers,
          multiValueHeaders: {'Set-Cookie': req.headers['set-cookie']},
          body: await buffer(req),
        }
        // handler
        var {session, redirect, response} = await grant(event)
        if (redirect) {
          var {statusCode, headers, multiValueHeaders, body} = redirect
          res.writeHead(statusCode, {...headers, ...multiValueHeaders})
          res.end(JSON.stringify(body))
        }
        else if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
        else {
          res.statusCode = 404
          res.end('Not Found')
        }
      })

      var buffer = (req, body = []) => new Promise((resolve, reject) => req
        .on('data', (chunk) => body.push(chunk))
        .on('end', () => resolve(Buffer.concat(body).toString('utf8')))
        .on('error', reject)
      )

      server.listen(port, () => resolve({grant, server}))
    }),
    azure: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var db = {}
      var session = {
        secret: 'grant',
        store: {
          get: async (key) => db[key],
          set: async (key, value) => db[key] = value,
          remove: async (key) => delete db[key],
        }
      }
      var grant =
        index === 1 ? Grant.azure()({config, session}) :
        index === 3 ? Grant.azure({config, session}) :
        index === 4 ? Grant({config, session, handler: 'azure'}) :
        Grant({config, session, request, state, extend, handler: 'azure'})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // azure
        req.originalUrl = `http://localhost:${port}${req.url.split('?')[0]}`
        req.query = qs.parse(req.url.split('?')[1])
        req.body = qs.parse(await buffer(req))
        if (req.query.code) {
          req.query.oauth_code = req.query.code
          delete req.query.code
        }
        // handler
        var {session, redirect, response} = await grant(req)
        if (redirect) {
          var {status, headers, body} = redirect
          res.writeHead(status, headers)
          res.end(JSON.stringify(body))
        }
        else if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
        else {
          res.statusCode = 404
          res.end('Not Found')
        }
      })

      var buffer = (req, body = []) => new Promise((resolve, reject) => req
        .on('data', (chunk) => body.push(chunk))
        .on('end', () => resolve(Buffer.concat(body).toString('utf8')))
        .on('error', reject)
      )

      server.listen(port, () => resolve({grant, server}))
    }),
    gcloud: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var db = {}
      var session = {
        secret: 'grant',
        store: {
          get: async (key) => db[key],
          set: async (key, value) => db[key] = value,
          remove: async (key) => delete db[key],
        }
      }

      var grant =
        index === 1 ? Grant.gcloud()({config, session}) :
        index === 3 ? Grant.gcloud({config, session}) :
        index === 4 ? Grant({config, session, handler: 'gcloud'}) :
        Grant({config, session, request, state, extend, handler: 'gcloud'})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // gcloud
        req.query = req.url.split('?')[1]
        req.body = qs.parse(await buffer(req))
        // handler
        var {session, response, redirect} = await grant(req, res)
        if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
        else if (!redirect) {
          res.statusCode = 404
          res.end('Not Found')
        }
      })

      var buffer = (req, body = []) => new Promise((resolve, reject) => req
        .on('data', (chunk) => body.push(chunk))
        .on('end', () => resolve(Buffer.concat(body).toString('utf8')))
        .on('error', reject)
      )

      server.listen(port, () => resolve({grant, server}))
    }),
    vercel: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var db = {}
      var session = {
        secret: 'grant',
        store: {
          get: async (key) => db[key],
          set: async (key, value) => db[key] = value,
          remove: async (key) => delete db[key],
        }
      }

      var grant =
        index === 1 ? Grant.vercel()({config, session}) :
        index === 3 ? Grant.vercel({config, session}) :
        index === 4 ? Grant({config, session, handler: 'vercel'}) :
        Grant({config, session, request, state, extend, handler: 'vercel'})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // vercel
        req.cookies = cookie.parse(req.headers.cookie || '')
        req.query = req.url.split('?')[1]
        req.body = qs.parse(await buffer(req))
        // handler
        var {session, response, redirect} = await grant(req, res)
        if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
        else if (!redirect) {
          res.statusCode = 404
          res.end('Not Found')
        }
      })

      var buffer = (req, body = []) => new Promise((resolve, reject) => req
        .on('data', (chunk) => body.push(chunk))
        .on('end', () => resolve(Buffer.concat(body).toString('utf8')))
        .on('error', reject)
      )

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

      var app = new koa()
      app.keys = ['grant']

      var server = app
        .use(koa.session(app))
        .use(koa.parser())
        .use(grant)
        .use(callback.koa1)
        .listen(port, () => resolve({grant, server}))
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

      var server = express()
        .use(grant)
        .use((err, req, res, next) => {
          res.end(err.message)
        })
        .listen(port, () => resolve({grant, server}))
    }),
    koa: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new koa()

      var server = app
        .use(async (ctx, next) => {
          try {
            await next()
          }
          catch (err) {
            ctx.body = err.message
          }
        })
        .use(grant)
        .listen(port, () => resolve({grant, server}))
    }),
    hapi: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.hapi()(config)

      var server = new hapi.Server({host: 'localhost', port})
      server.events.on('request', (event, tags) => {
        t.equal(tags.error.message, 'Grant: register session plugin first')
      })

      server.register([
        {plugin: grant}
      ])
      .then(() => server.start().then(() => resolve({grant, server})))
    }),
    fastify: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.fastify()(config)

      var server = fastify()
      server
        .addHook('onError', async (req, res, err) => {
          t.equal(err.message, 'Grant: register session plugin first')
        })
        .register(grant)
        .listen({port})
        .then(() => resolve({grant, server}))
    }),
    curveball: ({config, request, state, extend, port, index}) => new Promise((resolve) => {
      var grant = Grant.curveball()(config)

      var app = new curveball()
      app.use(async (ctx, next) => {
        try {
          await next()
        }
        catch (err) {
          ctx.response.body = err.message
        }
      })
      app.use(grant)
      var server = app.listen(port)
      resolve({grant, server})
    }),
    koa1: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new koa()

      var server = app
        .use(function* (next) {
          try {
            yield next
          }
          catch (err) {
            this.body = err.message
          }
        })
        .use(grant)
        .listen(port, () => resolve({grant, server}))
    }),
    hapi16: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.hapi()(config)

      var server = new hapi.Server({debug: {request: false}})
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

      var server = express()
        .use(express.session({secret: 'grant', saveUninitialized: true, resave: false}))
        .use(grant)
        .use((err, req, res, next) => {
          res.end(err.message)
        })
        .listen(port, () => resolve({grant, server}))
    }),
    koa: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new koa()
      app.keys = ['grant']

      var server = app
        .use(koa.session(app))
        .use(async (ctx, next) => {
          try {
            await next()
          }
          catch (err) {
            ctx.body = err.message
          }
        })
        .use(grant)
        .listen(port, () => resolve({grant, server}))
    }),
    curveball: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.curveball()(config)

      var timeout, _setTimeout = global.setTimeout
      global.setTimeout = (cb, interval) => {
        timeout = _setTimeout(cb, interval)
      }

      var app = new curveball()
      app.use(curveball.session({store: 'memory'}))
      app.use(async (ctx, next) => {
        try {
          await next()
        }
        catch (err) {
          ctx.response.body = err.message
        }
      })
      app.use(grant)
      var server = app.listen(port)
      resolve({grant, server})

      server.on('close', () => {
        clearTimeout(timeout)
        global.setTimeout = _setTimeout
      })
    }),
    koa1: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new koa()
      app.keys = ['grant']

      var server = app
        .use(koa.session(app))
        .use(function* (next) {
          try {
            yield next
          }
          catch (err) {
            this.body = err.message
          }
        })
        .use(grant)
        .listen(port, () => resolve({grant, server}))
    }),
  },
  'path-prefix': {
    express: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.express()(config)

      var server = express()
        .use(express.parser.urlencoded({extended: true}))
        .use(express.session({secret: 'grant', saveUninitialized: true, resave: false}))
        .use('/oauth', grant)
        .get('/', callback.express)
        .listen(port, () => resolve({grant, server}))
    }),
    koa: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new koa()
      app.keys = ['grant']

      var server = app
        .use(koa.session(app))
        .use(koa.parser())
        .use(koa.mount('/oauth', grant))
        .use(callback.koa)
        .listen(port, () => resolve({grant, server}))
    }),
    hapi: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.hapi()(config)

      var server = new hapi.Server({host: 'localhost', port})
      server.route({method: 'GET', path: '/', handler: callback.hapi})

      server.register([
        {routes: {prefix: '/oauth'}, plugin: grant},
        {plugin: hapi.session, options: {cookieOptions:
          {password: '01234567890123456789012345678912', isSecure: false}}}
      ])
      .then(() => server.start().then(() => resolve({grant, server})))
    }),
    fastify: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.fastify()(config)

      var server = fastify()
      server
        .register(fastify.cookie)
        .register(fastify.session, {
          secret: '01234567890123456789012345678912', cookie: {secure: false}})
        .register(grant, {prefix: '/oauth'})
        .route({method: 'GET', path: '/', handler: callback.fastify})
        .listen({port})
        .then(() => resolve({grant, server}))
    }),
    koa1: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new koa()
      app.keys = ['grant']

      var server = app
        .use(koa.session(app))
        .use(koa.parser())
        .use(koa.mount('/oauth', grant))
        .use(callback.koa1)
        .listen(port, () => resolve({grant, server}))
    }),
    hapi16: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.hapi()(config)

      var server = new hapi.Server()
      server.connection({host: 'localhost', port})
      server.route({method: 'GET', path: '/', handler: callback.hapi16})

      server.register([
        {routes: {prefix: '/oauth'}, register: grant},
        {register: hapi.session, options: {cookieOptions:
          {password: '01234567890123456789012345678912', isSecure: false}}}
      ],
      () => server.start(() => resolve({grant, server})))
    }),
  },
  'lambda-prefix': {
    aws: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.aws({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // path is always prefixed by stage, but stage is also set as env var
        var stage = /^\/(.*?)\//.exec(req.url)[1]
        // aws
        var event = {
          httpMethod: req.method,
          requestContext: {path: req.url.split('?')[0], stage},
          queryStringParameters: qs.parse(req.url.split('?')[1]),
          headers: req.headers,
          multiValueHeaders: {'Set-Cookie': req.headers['set-cookie']},
        }
        // handler
        var {session, redirect, response} = await grant(event)
        if (redirect) {
          var {statusCode, headers, multiValueHeaders, body} = redirect
          res.writeHead(statusCode, {...headers, ...multiValueHeaders})
          res.end(JSON.stringify(body))
        }
        else if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    gcloud: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.gcloud({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // gcloud strips the lambda prefix from path, but sets it as env var
        process.env.FUNCTION_TARGET = /^\/(.*?)\//.exec(req.url)[1]
        req.url = req.url.replace(`/${process.env.FUNCTION_TARGET}`, '')
        // gcloud
        req.query = req.url.split('?')[1]
        // handler
        var {session, response} = await grant(req, res)
        if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
  },
  'dynamic-state': {
    express: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.express()(config)

      var app = express()
      app.use(express.parser.urlencoded({extended: true}))
      app.use(express.session({secret: 'grant', saveUninitialized: true, resave: false}))
      app.use((req, res, next) => {
        if (/^\/connect/.test(req.url)) {
          res.locals.grant = {dynamic: {key: 'very', secret: 'secret', foo: 'bar'}}
        }
        next()
      })
      app.use(grant)
      app.get('/', callback.express)

      var server = app.listen(port, () => resolve({grant, server, app}))
    }),
    koa: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new koa()
      app.keys = ['grant']

      var server = app
        .use(koa.session(app))
        .use(koa.parser())
        .use(async (ctx, next) => {
          if (/^\/connect/.test(ctx.path)) {
            ctx.state.grant = {dynamic: {key: 'very', 'secret': 'secret'}}
          }
          await next()
        })
        .use(grant)
        .use(callback.koa)
        .listen(port, () => resolve({grant, server}))
    }),
    hapi: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.hapi()(config)

      var server = new hapi.Server({host: 'localhost', port})
      server.ext('onPreHandler', (req, res) => {
        if (/^\/connect/.test(req.path)) {
          req.plugins.grant = {dynamic: {key: 'very', 'secret': 'secret'}}
        }
        return res.continue
      })
      server.route({method: 'GET', path: '/', handler: callback.hapi})

      server.register([
        {plugin: grant},
        {plugin: hapi.session, options: {cookieOptions:
          {password: '01234567890123456789012345678912', isSecure: false}}}
      ])
      .then(() => server.start().then(() => resolve({grant, server})))
    }),
    fastify: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.fastify()(config)

      var server = fastify()
      server
        .decorateRequest('grant', null)
        .addHook('preHandler', async (req, res) => {
          req.grant = {dynamic: {key: 'very', 'secret': 'secret'}}
        })
        .register(fastify.cookie)
        .register(fastify.session, {
          secret: '01234567890123456789012345678912', cookie: {secure: false}})
        .register(grant)
        .route({method: 'GET', path: '/', handler: callback.fastify})
        .listen({port})
        .then(() => resolve({grant, server}))
    }),
    curveball: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.curveball()(config)

      var timeout, _setTimeout = global.setTimeout
      global.setTimeout = (cb, interval) => {
        timeout = _setTimeout(cb, interval)
      }

      var app = new curveball()
      app.use(curveball.session({store: 'memory'}))
      app.use(async (ctx, next) => {
        if (/^\/connect/.test(ctx.path)) {
          ctx.state.grant = {dynamic: {key: 'very', 'secret': 'secret'}}
        }
        await next()
      })
      app.use(grant)
      app.use(curveball.router('/', callback.curveball))
      var server = app.listen(port)
      resolve({grant, server})

      server.on('close', () => {
        clearTimeout(timeout)
        global.setTimeout = _setTimeout
      })
    }),
    node: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.node({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        var state = {dynamic: {key: 'very', secret: 'secret'}}
        var {session, response} = await grant(req, res, state)
        if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    aws: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.aws({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // aws
        var event = {
          httpMethod: req.method,
          requestContext: {path: req.url.split('?')[0]},
          queryStringParameters: qs.parse(req.url.split('?')[1]),
          headers: req.headers,
          multiValueHeaders: {'Set-Cookie': req.headers['set-cookie']},
        }
        // handler
        var state = {dynamic: {key: 'very', secret: 'secret'}}
        var {session, redirect, response} = await grant(event, state)
        if (redirect) {
          var {statusCode, headers, multiValueHeaders, body} = redirect
          res.writeHead(statusCode, {...headers, ...multiValueHeaders})
          res.end(JSON.stringify(body))
        }
        else if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    azure: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.azure({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // azure
        req.originalUrl = `http://localhost:${port}${req.url.split('?')[0]}`
        req.query = qs.parse(req.url.split('?')[1])
        if (req.query.code) {
          req.query.oauth_code = req.query.code
          delete req.query.code
        }
        // handler
        var state = {dynamic: {key: 'very', secret: 'secret'}}
        var {session, redirect, response} = await grant(req, state)
        if (redirect) {
          var {status, headers, body} = redirect
          res.writeHead(status, headers)
          res.end(JSON.stringify(body))
        }
        else if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    gcloud: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.gcloud({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // gcloud
        req.query = req.url.split('?')[1]
        // handler
        var state = {dynamic: {key: 'very', secret: 'secret'}}
        var {session, response} = await grant(req, res, state)
        if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    vercel: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.vercel({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // vercel
        req.cookies = cookie.parse(req.headers.cookie || '')
        req.query = req.url.split('?')[1]
        // handler
        var state = {dynamic: {key: 'very', secret: 'secret'}}
        var {session, response} = await grant(req, res, state)
        if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    koa1: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new koa()
      app.keys = ['grant']

      var server = app
        .use(koa.session(app))
        .use(koa.parser())
        .use(function* (next) {
          if (/^\/connect/.test(this.path)) {
            this.state.grant = {dynamic: {key: 'very', 'secret': 'secret'}}
          }
          yield next
        })
        .use(grant)
        .use(callback.koa1)
        .listen(port, () => resolve({grant, server}))
    }),
    hapi16: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.hapi()(config)

      var server = new hapi.Server()
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
        {register: hapi.session, options: {cookieOptions:
          {password: '01234567890123456789012345678912', isSecure: false}}}
      ],
      () => server.start(() => resolve({grant, server})))
    }),
  },
  'transport-state': {
    express: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.express()(config)

      var server = express()
        .use(express.parser.urlencoded({extended: true}))
        .use(express.session({secret: 'grant', saveUninitialized: true, resave: false}))
        .use(grant)
        .use(callback.express)
        .listen(port, () => resolve({grant, server}))
    }),
    koa: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new koa()
      app.keys = ['grant']

      var server = app
        .use(koa.session(app))
        .use(koa.parser())
        .use(grant)
        .use(callback.koa)
        .listen(port, () => resolve({grant, server}))
    }),
    'koa-before': ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new koa()
      app.keys = ['grant']

      var server = app
        .use(koa.session(app))
        .use(koa.parser())
        .use(callback['koa-before'])
        .use(grant)
        .listen(port, () => resolve({grant, server}))
    }),
    hapi: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.hapi()(config)

      var server = new hapi.Server({host: 'localhost', port})
      server.ext('onPostHandler', (req, res) => {
        if (/\/callback$/.test(req.path)) {
          return callback.hapi(req, res)
        }
        return res.continue
      })

      server.register([
        {plugin: grant},
        {plugin: hapi.session, options: {cookieOptions:
          {password: '01234567890123456789012345678912', isSecure: false}}}
      ])
      .then(() => server.start().then(() => resolve({grant, server})))
    }),
    fastify: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.fastify()(config)

      var server = fastify()
      server
        .decorateReply('grant', null)
        .addHook('onSend', async (req, res, payload) => {
          if (/\/callback(?:$|\?)/.test(req.url)) {
            res.header('content-type', 'application/json')
            payload = callback.fastify(req, res)
            return payload
          }
          return payload
        })
        .register(fastify.cookie)
        .register(fastify.session, {
          secret: '01234567890123456789012345678912', cookie: {secure: false}})
        .register(grant)
        .listen({port})
        .then(() => resolve({grant, server}))
    }),
    curveball: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.curveball()(config)

      var timeout, _setTimeout = global.setTimeout
      global.setTimeout = (cb, interval) => {
        timeout = _setTimeout(cb, interval)
      }

      var app = new curveball()
      app.use(curveball.session({store: 'memory'}))
      app.use(grant)
      app.use(callback.curveball)
      var server = app.listen(port)
      resolve({grant, server})

      server.on('close', () => {
        clearTimeout(timeout)
        global.setTimeout = _setTimeout
      })
    }),
    node: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.node({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        var {session, response} = await grant(req, res)
        if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    aws: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.aws({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // aws
        var event = {
          httpMethod: req.method,
          requestContext: {path: req.url.split('?')[0]},
          queryStringParameters: qs.parse(req.url.split('?')[1]),
          headers: req.headers,
          multiValueHeaders: {'Set-Cookie': req.headers['set-cookie']},
        }
        // handler
        var {session, redirect, response} = await grant(event)
        if (redirect) {
          var {statusCode, headers, multiValueHeaders, body} = redirect
          res.writeHead(statusCode, {...headers, ...multiValueHeaders})
          res.end(JSON.stringify(body))
        }
        else if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    azure: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.azure({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // azure
        req.originalUrl = `http://localhost:${port}${req.url.split('?')[0]}`
        req.query = qs.parse(req.url.split('?')[1])
        if (req.query.code) {
          req.query.oauth_code = req.query.code
          delete req.query.code
        }
        // handler
        var {session, redirect, response} = await grant(req)
        if (redirect) {
          var {status, headers, body} = redirect
          res.writeHead(status, headers)
          res.end(JSON.stringify(body))
        }
        else if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    gcloud: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.gcloud({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // gcloud
        req.query = req.url.split('?')[1]
        // handler
        var {session, response} = await grant(req, res)
        if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    vercel: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.vercel({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // vercel
        req.cookies = cookie.parse(req.headers.cookie || '')
        req.query = req.url.split('?')[1]
        // handler
        var {session, response} = await grant(req, res)
        if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    koa1: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new koa()
      app.keys = ['grant']

      var server = app
        .use(koa.session(app))
        .use(koa.parser())
        .use(grant)
        .use(callback.koa1)
        .listen(port, () => resolve({grant, server}))
    }),
    'koa-before1': ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new koa()
      app.keys = ['grant']

      var server = app
        .use(koa.session(app))
        .use(koa.parser())
        .use(callback['koa-before1'])
        .use(grant)
        .listen(port, () => resolve({grant, server}))
    }),
    hapi16: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.hapi()(config)

      var server = new hapi.Server()
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
        {register: hapi.session, options: {cookieOptions:
          {password: '01234567890123456789012345678912', isSecure: false}}}
      ],
      () => server.start(() => resolve({grant, server})))
    }),
  },
  'cookie-store': {
    express: ({config, port}) => new Promise((resolve) => {
      var grant = Grant.express()(config)

      var server = express()
        .use(express.parser.urlencoded({extended: true}))
        .use(express.cookie({signed: true, secret: 'grant', maxAge: 60 * 1000}))
        .use(grant)
        .get('/', callback.express)
        .listen(port, () => resolve({grant, server}))
    }),
    node: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.node({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        var {session, response} = await grant(req, res)
        if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    aws: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.aws({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // aws
        var event = {
          httpMethod: req.method,
          requestContext: {path: req.url.split('?')[0]},
          queryStringParameters: qs.parse(req.url.split('?')[1]),
          headers: req.headers,
          multiValueHeaders: {'Set-Cookie': req.headers['set-cookie']},
        }
        // handler
        var {session, redirect, response} = await grant(event)
        if (redirect) {
          var {statusCode, headers, multiValueHeaders, body} = redirect
          res.writeHead(statusCode, {...headers, ...multiValueHeaders})
          res.end(JSON.stringify(body))
        }
        else if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    azure: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.azure({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // azure
        req.originalUrl = `http://localhost:${port}${req.url.split('?')[0]}`
        req.query = qs.parse(req.url.split('?')[1])
        if (req.query.code) {
          req.query.oauth_code = req.query.code
          delete req.query.code
        }
        // handler
        var {session, redirect, response} = await grant(req)
        if (redirect) {
          var {status, headers, body} = redirect
          res.writeHead(status, headers)
          res.end(JSON.stringify(body))
        }
        else if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    gcloud: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.gcloud({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // gcloud
        req.query = req.url.split('?')[1]
        // handler
        var {session, response} = await grant(req, res)
        if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    vercel: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.vercel({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        // vercel
        req.cookies = cookie.parse(req.headers.cookie || '')
        req.query = req.url.split('?')[1]
        // handler
        var {session, response} = await grant(req, res)
        if (response || /^\/(?:\?|$)/.test(req.url)) {
          callback.handler(req, res, session, response)
        }
      })

      server.listen(port, () => resolve({grant, server}))
    }),
  },
  'next-tick': {
    node: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.node({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        if (req.url !== '/connect/oauth2') {
          res.statusCode = 200
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({status: 'redirect followed'}))
          return
        }
        // handler
        await grant(req, res)
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({status: 'redirect prevented'}))
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    gcloud: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.gcloud({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        if (req.url !== '/connect/oauth2') {
          res.statusCode = 200
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({status: 'redirect followed'}))
          return
        }
        // gcloud
        req.query = req.url.split('?')[1]
        // handler
        await grant(req, res)
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({status: 'redirect prevented'}))
      })

      server.listen(port, () => resolve({grant, server}))
    }),
    vercel: ({config, port}) => new Promise((resolve) => {
      var session = {secret: 'grant'}
      var grant = Grant.vercel({config, session})

      var server = http.createServer()
      server.on('request', async (req, res) => {
        if (req.url !== '/connect/oauth2') {
          res.statusCode = 200
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({status: 'redirect followed'}))
          return
        }
        // vercel
        req.cookies = cookie.parse(req.headers.cookie || '')
        req.query = req.url.split('?')[1]
        // handler
        await grant(req, res)
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({status: 'redirect prevented'}))
      })

      server.listen(port, () => resolve({grant, server}))
    }),
  },
  'third-party': {
    'koa-mount': ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new koa()
      app.keys = ['grant']

      var server = app
        .use(koa.session(app))
        .use(koa.parser())
        .use(koa.mount(grant))
        .use(callback.koa)
        .listen(port, () => resolve({grant, server}))
    }),
    'koa-qs': ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new koa()
      app.keys = ['grant']

      var server = koa.qs(app)
        .use(koa.session(app))
        .use(koa.parser())
        .use(koa.mount(grant))
        .use(callback['koa-qs'])
        .listen(port, () => resolve({grant, server}))
    }),
    'koa-mount1': ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new koa()
      app.keys = ['grant']

      var server = app
        .use(koa.session(app))
        .use(koa.parser())
        .use(koa.mount(grant))
        .use(callback.koa1)
        .listen(port, () => resolve({grant, server}))
    }),
    'koa-qs1': ({config, port}) => new Promise((resolve) => {
      var grant = Grant.koa()(config)

      var app = new koa()
      app.keys = ['grant']

      var server = koa.qs(app)
        .use(koa.session(app))
        .use(koa.parser())
        .use(koa.mount(grant))
        .use(callback['koa-qs1'])
        .listen(port, () => resolve({grant, server}))
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
        response: (ctx.state.grant || {}).response || ctx.session.grant.response || qs.parse(ctx.request.query),
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
  fastify: (req, res) => {
    var query = qs.parse(req.query)
    var body = {
      session: req.session.grant,
      response: (res.grant || {}).response || req.session.grant.response || query,
      state: res.grant,
    }
    return Object.keys(res.grant || {}).length ? JSON.stringify(body) : res.send(body)
  },
  curveball: (ctx) => {
    ctx.response.body = {
      session: ctx.state.session.grant,
      response: (ctx.state.grant || {}).response || ctx.state.session.grant.response || qs.parse(ctx.request.query),
      state: ctx.state.grant,
    }
  },
  handler: async (req, res, session, state) => {
    var query = qs.parse(req.url.split('?')[1])
    session = await session.get()
    res.writeHead(200, {'content-type': 'application/json'})
    res.end(JSON.stringify({
      session: session.grant,
      response: session.grant.response || state || query,
      state: {response: state},
    }))
  },
  'koa-before': async (ctx, next) => {
    await next()
    if (ctx.path === '/' || /\/callback$/.test(ctx.path)) {
      ctx.response.status = 200
      ctx.set('content-type', 'application/json')
      ctx.body = JSON.stringify({
        session: ctx.session.grant,
        response: (ctx.state.grant || {}).response || ctx.session.grant.response || qs.parse(ctx.request.query),
        state: ctx.state.grant,
      })
    }
  },
  'koa-qs': (ctx) => {
    if (ctx.path === '/') {
      ctx.response.status = 200
      ctx.set('content-type', 'application/json')
      ctx.body = JSON.stringify({
        session: ctx.session.grant,
        response: ctx.request.query,
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
        response: (this.state.grant || {}).response || this.session.grant.response || qs.parse(this.request.query),
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
  'koa-qs1': function* () {
    if (this.path === '/') {
      this.response.status = 200
      this.set('content-type', 'application/json')
      this.body = JSON.stringify({
        session: this.session.grant,
        response: this.request.query,
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
