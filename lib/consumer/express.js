
var express = require('express')
var _consumer = require('../consumer')


module.exports = function (config) {
  var app = express()
  var consumer = _consumer({config})
  app.config = consumer.config

  app.use('/connect/:provider/:override?', (req, res, next) => {
    if (!req.session) {
      throw new Error('Grant: mount session middleware first')
    }
    if (req.method === 'POST' && !req.body) {
      throw new Error('Grant: mount body parser middleware first')
    }

    consumer({
      method: req.method,
      params: req.params,
      query: req.query,
      body: req.body,
      state: res.locals.grant,
      session: req.session.grant,
    }).then(({error, url, session, state}) => {
      req.session.grant = session
      res.locals.grant = state
      error ? res.end(error) : url ? redirect(req, res, url) : next()
    })
  })

  return app
}

var redirect = (req, res, url) =>
  typeof req.session.save === 'function' &&
    Object.getPrototypeOf(req.session).save.length
      ? req.session.save(() => res.redirect(url))
      : res.redirect(url)
