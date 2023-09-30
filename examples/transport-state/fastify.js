
var fastify = require('fastify')
var cookie = require('@fastify/cookie')
var session = require('@fastify/session')
var grant = require('../../').fastify()


fastify()
  .decorateReply('grant', null)
  .addHook('onSend', async (req, res, payload) => {
    if (/^\/connect\/.*?\/callback/.test(req.url)) {
      res.header('content-type', 'text/plain')
      payload = JSON.stringify(res.grant.response, null, 2)
      return payload
    }
    return payload
  })
  .register(cookie)
  .register(session, {secret: '01234567890123456789012345678912', cookie: {secure: false}})
  .register(grant(require('./config')))
  .listen({port: 3000})
