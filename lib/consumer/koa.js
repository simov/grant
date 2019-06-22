
var qs = require('qs')

var config = require('../config')
var oauth1 = require('../flow/oauth1')
var oauth2 = require('../flow/oauth2')

// /:path*/connect/:provider/:override?
var regex = /^(?:\/([^\\/]+?(?:\/[^\\/]+?)*))?\/connect\/([^\\/]+?)(?:\/([^\\/]+?))?(?:\/(?=$))?$/i


module.exports = function (_config) {
  app.config = config(_config)

  function* app (next) {
    var match = regex.exec(this.path)
    if (!match) {
      return yield next
    }

    if (!this.session) {
      throw new Error('Grant: mount session middleware first')
    }
    if (this.method === 'POST' && !this.request.body) {
      throw new Error('Grant: mount body parser middleware first')
    }

    var provider = match[2]
    var override = match[3]

    if (this.method === 'GET') {
      if (override === 'callback') {
        return yield callback
      }

      this.session.grant = {
        provider: provider
      }
      if (override) {
        this.session.grant.override = override
      }
      if (Object.keys(this.request.query || {}).length) {
        this.session.grant.dynamic = this.request.query
      }

      yield connect
    }

    else if (this.method === 'POST') {
      this.session.grant = {
        provider: provider
      }
      if (override) {
        this.session.grant.override = override
      }
      if (Object.keys(this.request.body || {}).length) {
        this.session.grant.dynamic = this.request.body
      }

      yield connect
    }
  }

  var transport = (provider, ctx, session) => (data) => {
    if (!provider.callback) {
      ctx.body = qs.stringify(data)
    }
    else if (!provider.transport || provider.transport === 'querystring') {
      ctx.response.redirect(`${provider.callback}?${qs.stringify(data)}`)
    }
    else if (provider.transport === 'session') {
      session.response = data
      ctx.response.redirect(provider.callback)
    }
  }

  function* connect () {
    var session = this.session.grant
    var provider = config.provider(app.config, session)
    var response = transport(provider, this, session)

    if (provider.oauth === 1) {
      try {
        var result = yield oauth1.request(provider)
        session.request = result.body
        var url = yield oauth1.authorize(provider, result.body)
        this.response.redirect(url)
      }
      catch (err) {
        response(err)
      }
    }

    else if (provider.oauth === 2) {
      try {
        session.state = provider.state
        session.nonce = provider.nonce
        var url = yield oauth2.authorize(provider)
        this.response.redirect(url)
      }
      catch (err) {
        response(err)
      }
    }

    else {
      response({error: 'Grant: missing or misconfigured provider'})
    }
  }

  function* callback () {
    var session = this.session.grant || {}
    var provider = config.provider(app.config, session)
    var response = transport(provider, this, session)

    if (provider.oauth === 1) {
      try {
        var data = yield oauth1.access(provider, session.request, this.query)
        response(data)
      }
      catch (err) {
        response(err)
      }
    }

    else if (provider.oauth === 2) {
      try {
        var data = yield oauth2.access(provider, this.query, session)
        response(data)
      }
      catch (err) {
        response(err)
      }
    }

    else {
      response({error: 'Grant: missing session or misconfigured provider'})
    }
  }

  return app
}
