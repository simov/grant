
var fastify = require('fastify')
var cookie = require('@fastify/cookie')
var session = require('@fastify/session')
var grant = require('../../').fastify()


fastify()
  .decorateRequest('grant', null)
  .addHook('preHandler', async (req, res) => {
    if (/^\/connect\/google/.test(req.url)) {
      req.grant = {dynamic: {scope: ['openid']}}
    }
    else if (/^\/connect\/twitter/.test(req.url)) {
      req.grant = {dynamic: {key: 'CONSUMER_KEY', 'secret': 'CONSUMER_SECRET'}}
    }
  })
  .register(cookie)
  .register(session, {secret: '01234567890123456789012345678912', cookie: {secure: false}})
  .register(grant(require('./config')))
  .route({method: 'GET', path: '/hello', handler: async (req, res) => {
    res.send(JSON.stringify(req.session.grant.response, null, 2))
  }})
  .route({method: 'GET', path: '/hi', handler: async (req, res) => {
    res.send(JSON.stringify(req.session.grant.response, null, 2))
  }})
  .listen({port: 3000})
