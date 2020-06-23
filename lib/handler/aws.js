
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

  async function app (req, _session, state) {
    var match = regex.exec(req.path)
    if (!match) {
      return
    }

    if (!_session) {
      throw new Error('Grant: session store is required')
    }

    var {location, session, state} = await grant({
      method: req.httpMethod,
      params: {provider: match[1], override: match[2]},
      query: req.queryStringParameters,
      body: req.httpMethod === 'POST' ? qs.parse(req.body) : {},
      state,
      session: (await _session.get()).grant
    })

    await _session.set({grant: session})

    return location
      ? JSON.parse(JSON.stringify({
          statusCode: 302,
          headers: {
            location,
            'set-cookie': _session.headers['set-cookie']
          }
        }))
      : {state: {grant: state}}
  }

  return app
}
