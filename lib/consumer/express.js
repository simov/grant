
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

    // callback
    if (req.method === 'GET' && req.params.override === 'callback') {
      var session = req.session.grant = req.session.grant || {}
      var query = req.query
      var state = res.locals.grant = res.locals.grant || {}

      consumer.callback({session, query, state}) // mutates session/state
        .then(({url, error}) =>
          error ? res.end(error) : url ? redirect(req, res, url) : next())
    }

    // connect
    else {
      var session = req.session.grant = {}
      session.provider = req.params.provider

      if (req.params.override) {
        session.override = req.params.override
      }
      if (req.method === 'GET' && Object.keys(req.query || {}).length) {
        session.dynamic = req.query
      }
      else if (req.method === 'POST' && Object.keys(req.body || {}).length) {
        session.dynamic = req.body
      }

      var state = res.locals.grant

      consumer.connect({session, state}) // mutates session
        .then(({url, error}) => error ? res.end(error) : redirect(req, res, url))
    }
  })

  return app
}

var redirect = (req, res, url) =>
  typeof req.session.save === 'function' &&
    Object.getPrototypeOf(req.session).save.length
      ? req.session.save(() => res.redirect(url))
      : res.redirect(url)
