
var qs = require('qs')
var Grant = require('../grant')


module.exports = function (args) {
  var grant = Grant((args || {}).config ? args : {config: args})
  app.config = grant.config

  var regex = new RegExp([
    '^',
    app.config.defaults.prefix,
    /(?:\/([^\/\?]+?))/.source, // /:provider
    /(?:\/([^\/\?]+?))?/.source, // /:override?
    /(?:\/$|\/?\?+.*)?$/.source, // querystring
  ].join(''), 'i')

  function* app (next) {
    var match = regex.exec(this.request.originalUrl)
    if (!match) {
      return yield next
    }

    if (!this.session) {
      throw new Error('Grant: mount session middleware first')
    }
    if (this.method === 'POST' && !this.request.body) {
      throw new Error('Grant: mount body parser middleware first')
    }

    var result = yield grant({
      method: this.method,
      params: {provider: match[1], override: match[2]},
      query: qs.parse(this.request.query),
      body: this.request.body,
      state: this.state.grant,
      session: this.session.grant,
    })

    this.session.grant = result.session
    this.state.grant = result.state
    result.location ? this.response.redirect(result.location) : yield next
  }

  return app
}
