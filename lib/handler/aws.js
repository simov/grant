
var qs = require('qs')
var Grant = require('../grant')
var Session = require('../session')


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

  var store = Session(args.session)

  async function app (req, state) {
    var session = store(req)
    var match = regex.exec(req.requestContext.path)
    if (!match) {
      return {session}
    }

    var {location, session:sess, state} = await grant({
      method: req.httpMethod,
      params: {provider: match[1], override: match[2]},
      query: req.queryStringParameters,
      body: req.httpMethod === 'POST' ? qs.parse(req.body) : {},
      state,
      session: (await session.get()).grant
    })

    await session.set({grant: sess})

    return location
      ? {session, redirect: redirect(location, session)}
      : {session, response: state.response || sess.response}
  }

  return app
}

var redirect = (location, session) => ({
  statusCode: 302,
  headers: {location},
  multiValueHeaders: {'set-cookie': session.headers['set-cookie']}
})
