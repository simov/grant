
var _consumer = require('../consumer')

// /:path*/connect/:provider/:override?
var regex = /^(?:\/([^\\/]+?(?:\/[^\\/]+?)*))?\/connect\/([^\\/]+?)(?:\/([^\\/]+?))?(?:\/(?=$))?$/i


module.exports = function (config) {
  var consumer = _consumer({config: config})
  app.config = consumer.config

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

    var params = {
      provider: match[2],
      override: match[3]
    }

    var result = yield consumer({
      method: this.method,
      params: params,
      query: this.request.query,
      body: this.request.body,
      state: this.state.grant,
      session: this.session.grant,
    })

    this.session.grant = result.session
    this.state.grant = result.state
    result.error ? (this.body = result.error) :
    result.url ? this.response.redirect(result.url) : yield next
  }

  return app
}
