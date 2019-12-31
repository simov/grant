
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

    var provider = match[2]
    var override = match[3]

    // callback
    if (this.method === 'GET' && override === 'callback') {
      var state = this.session.grant = this.session.grant || {}
      var result = yield consumer.callback({state: state, query: this.request.query}) // mutates state
      result.error ? (this.body = result.error) : this.response.redirect(result.url)
    }

    // connect
    else {
      var state = this.session.grant = {}
      state.provider = provider

      if (override) {
        state.override = override
      }
      if (this.method === 'GET' && Object.keys(this.request.query || {}).length) {
        state.dynamic = this.request.query
      }
      else if (this.method === 'POST' && Object.keys(this.request.body || {}).length) {
        state.dynamic = this.request.body
      }

      var result = yield consumer.connect({state: state}) // mutates state
      result.error ? (this.body = result.error) : this.response.redirect(result.url)
    }
  }

  return app
}
