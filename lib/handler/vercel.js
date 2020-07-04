
var qs = require('qs')
var Grant = require('../grant')


module.exports = function (args = {}) {
  var grant = Grant(args.config ? args : {config: args})
  app.config = grant.config

  var regex = new RegExp([
    '^',
    app.config.defaults.prefix,
    /(?:\/([^\/\?]+?))/.source, // /:provider
    /(?:\/([^\/\?]+?))?/.source, // /:override?
    /(?:\/$|\/?\?+.*)?$/.source, // querystring
  ].join(''), 'i')

  async function app (req, res, _session, state) {
    var match = regex.exec(req.url)
    if (!match) {
      return
    }

    if (!_session) {
      throw new Error('Grant: session store is required')
    }

    var {location, session, state} = await grant({
      method: req.method,
      params: {provider: match[1], override: match[2]},
      query: qs.parse(req.query),
      body: req.body,
      state,
      session: (await _session.get()).grant
    })

    await _session.set({grant: session})

    return location ? redirect(res, location) : {state: {grant: state}}
  }

  return app
}

var redirect = (res, location) => {
  res.statusCode = 302
  res.setHeader('location', location)
  res.end()
}
