
var fastify = require('fastify')
var cookie = require('@fastify/cookie')
var session = require('@fastify/session')
var parser = require('@fastify/formbody')
var grant = require('../../').fastify()
var fs = require('fs')


fastify()
  .register(cookie)
  .register(session, {secret: '01234567890123456789012345678912', cookie: {secure: false}})
  .register(parser)
  .register(grant(require('./config')))
  .route({method: 'GET', path: '/login', handler: async (req, res) => {
    res.header('content-type', 'text/html')
    res.send(fs.readFileSync('./form.html', 'utf8'))
  }})
  .route({method: 'GET', path: '/hello', handler: async (req, res) => {
    res.send(JSON.stringify(req.session.grant.response, null, 2))
  }})
  .listen({port: 3000})
