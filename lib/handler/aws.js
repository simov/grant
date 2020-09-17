
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

  async function app (event, state) {
    var req = params(event)
    var session = store(req)
    var match = regex.exec(req.path)
    if (!match) {
      return {session}
    }

    var {location, session:sess, state} = await grant({
      method: req.method,
      params: {provider: match[1], override: match[2]},
      query: req.query,
      body: req.body,
      state,
      session: (await session.get()).grant
    })

    await session.set({grant: sess})

    return location
      ? {session, redirect: redirect(event, location, session)}
      : {session, response: state.response || sess.response}
  }

  return app
}

var path = ({version, path, rawPath, requestContext:ctx} = event) =>
  version === '2.0' ? rawPath :
  version === '1.0' ? path : ctx.path

var body = ({body, isBase64Encoded} = event) =>
  body
    ? isBase64Encoded ? Buffer.from(body, 'base64').toString()
    : body : {}

var params = (event) =>
  !event.version || event.version === '1.0' ?
    {
      method: event.httpMethod,
      path: path(event),
      query: qs.parse(event.queryStringParameters),
      headers: event.headers,
      body: qs.parse(body(event)),
    }
  : event.version === '2.0' ?
    {
      method: event.requestContext.http.method,
      path: path(event),
      query: qs.parse(event.rawQueryString),
      headers: {...event.headers, Cookie: (event.cookies || []).join('; ')},
      body: qs.parse(body(event)),
    }
  : {}

var redirect = (event, location, session) =>
  !event.version || event.version === '1.0' ?
  {
    statusCode: 302,
    headers: {location},
    multiValueHeaders: {'set-cookie': session.headers['set-cookie']}
  }
  : event.version === '2.0' ?
  {
    statusCode: 302,
    headers: {location},
    cookies: session.headers['set-cookie']
  }
  : {}
