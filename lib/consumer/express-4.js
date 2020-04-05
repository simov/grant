
var express = require('express')
var _consumer = require('../grant')


module.exports = function (config) {
  var app = express()
  var consumer = _consumer({config})
  app.config = consumer.config

  var regex = new RegExp([
    '^',
    app.config.defaults.prefix.replace(/\//g, '\/'),
    /\/([^\\/]+?)/.source, // /:provider
    /(?:\/([^\\/]+?))?/.source, // /:override?
    /\/?(?:\?([^/]+))?$/.source, // querystring
  ].join(''))

  app.use((req, res, next) => {
    var match = regex.exec(req.originalUrl)
    if (!match) {
      return next()
    }

    if (!req.session) {
      throw new Error('Grant: mount session middleware first')
    }
    if (req.method === 'POST' && !req.body) {
      throw new Error('Grant: mount body parser middleware first')
    }

    var params = {
      provider: match[1],
      override: match[2]
    }

    consumer({
      method: req.method,
      params,
      query: req.query,
      body: req.body,
      state: res.locals.grant,
      session: req.session.grant,
    }).then(({location, session, state}) => {
      req.session.grant = session
      res.locals.grant = state
      location ? redirect(req, res, location) : next()
    })
  })

  return app
}

var redirect = (req, res, location) =>
  typeof req.session.save === 'function' &&
    Object.getPrototypeOf(req.session).save.length
      ? req.session.save(() => res.redirect(location))
      : res.redirect(location)
