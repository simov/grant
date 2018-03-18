
var Koa = require('koa')
var qs = require('qs')

var config = require('../config')
var flows = {
  1: require('../flow/oauth1'),
  2: require('../flow/oauth2'),
  response: require('../response')
}

// /:path*/connect/:provider/:override?
var regex = /^(?:\/([^\\/]+?(?:\/[^\\/]+?)*))?\/connect\/([^\\/]+?)(?:\/([^\\/]+?))?(?:\/(?=$))?$/i


module.exports = function (_config) {
  var app = new Koa()
  app.config = config.init(_config)

  app.use(function* (next) {
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
  })

  function* connect () {
    var grant = this.session.grant
    var provider = config.provider(app.config, grant)
    var flow = flows[provider.oauth]

    var transport = (data) => {
      if (!provider.callback) {
        this.body = qs.stringify(data)
      }
      else if (!provider.transport || provider.transport === 'querystring') {
        this.response.redirect((provider.callback || '') + '?' + qs.stringify(data))
      }
      else if (provider.transport === 'session') {
        this.session.grant.response = data
        this.response.redirect(provider.callback || '')
      }
    }
    var success = (url) => this.response.redirect(url)
    var error = (err) => transport({error: err.body})

    if (/^1$/.test(provider.oauth)) {
      try {
        var result = yield flow.request(provider)
        grant.request = result.body
        var url = yield flow.authorize(provider, result.body)
        success(url)
      }
      catch (err) {
        error(err)
      }
    }

    else if (/^2$/.test(provider.oauth)) {
      try {
        grant.state = provider.state
        var url = yield flow.authorize(provider)
        success(url)
      }
      catch (err) {
        error(err)
      }
    }

    else {
      error({body: 'Grant: missing or misconfigured provider'})
    }
  }

  function* callback () {
    var grant = this.session.grant || {}
    var provider = config.provider(app.config, grant)
    var flow = flows[provider.oauth]

    var transport = (data) => {
      if (!provider.callback) {
        this.body = qs.stringify(data)
      }
      else if (!provider.transport || provider.transport === 'querystring') {
        this.response.redirect((provider.callback || '') + '?' + qs.stringify(data))
      }
      else if (provider.transport === 'session') {
        this.session.grant.response = data
        this.response.redirect(provider.callback || '')
      }
    }
    var success = (data) => transport(data)
    var error = (err) => transport({error: err.body})

    if (/^1$/.test(provider.oauth)) {
      try {
        var result = yield flow.access(provider, grant.request, this.query)
        success(flows.response(provider, result.body))
      }
      catch (err) {
        error(err)
      }
    }

    else if (/^2$/.test(provider.oauth)) {
      try {
        var result = yield flow.access(provider, this.query, grant)
        success(flows.response(provider, result.body))
      }
      catch (err) {
        error(err)
      }
    }

    else {
      error({body: 'Grant: missing session or misconfigured provider'})
    }
  }

  return app
}
