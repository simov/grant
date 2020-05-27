
var express = require('express')
var Grant = require('../grant')


module.exports = function (args = {}) {
  var app = express()
  var grant = Grant(args.config ? args : {config: args})
  app.config = grant.config

  var regex = new RegExp([
    '^',
    app.config.defaults.prefix,
    /(?:\/([^\/\?]+?))/.source, // /:provider
    /(?:\/([^\/\?]+?))?/.source, // /:override?
    /(?:\/$|\/?\?+.*)?$/.source, // querystring
  ].join(''), 'i')

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

    grant({
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
