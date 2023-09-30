
var fastify = require('fastify')
var session = require('@fastify/secure-session')
var grant = require('../../').fastify()


fastify()
  .register(session, {
    secret: '01234567890123456789012345678912',
    salt: 'mOXbPOPAcEb8hMDH',
    cookie: { path: '/', httpOnly: true }
  })
  .addHook('onRequest', (req, res, next) => {
    Object.defineProperty(req.session, 'grant', {
      get: () => req.session.get('grant'),
      set: (value) => req.session.set('grant', value)
    })
    next()
  })
  .register(grant(require('./config')))
  .route({method: 'GET', path: '/hello', handler: async (req, res) => {
    res.send(JSON.stringify(req.session.grant.response, null, 2))
  }})
  .route({method: 'GET', path: '/hi', handler: async (req, res) => {
    res.send(JSON.stringify(req.session.grant.response, null, 2))
  }})
  .listen({port: 3000})
