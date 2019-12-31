
var express = require('express')
var _consumer = require('../consumer')


module.exports = function (config) {
  var app = express()
  var consumer = _consumer({config})
  app.config = consumer.config

  app.use('/connect/:provider/:override?', (req, res) => {
    if (!req.session) {
      throw new Error('Grant: mount session middleware first')
    }
    if (req.method === 'POST' && !req.body) {
      throw new Error('Grant: mount body parser middleware first')
    }

    // callback
    if (req.method === 'GET' && req.params.override === 'callback') {
      var state = req.session.grant = req.session.grant || {}
      consumer.callback({state, query: req.query}) // mutates state
        .then(({url, error}) => error ? res.end(error) : redirect(req, res, url))
    }

    // connect
    else {
      var state = req.session.grant = {}
      state.provider = req.params.provider

      if (req.params.override) {
        state.override = req.params.override
      }
      if (req.method === 'GET' && Object.keys(req.query || {}).length) {
        state.dynamic = req.query
      }
      else if (req.method === 'POST' && Object.keys(req.body || {}).length) {
        state.dynamic = req.body
      }

      consumer.connect({state}) // mutates state
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
