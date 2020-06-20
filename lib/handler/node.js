
var qs = require('qs')
var Grant = require('../grant')
var session = require('../session')


module.exports = function (args = {}) {
  var grant = Grant(args.config ? args : {config: args})
  app.config = grant.config

  var regex = new RegExp([
    '^',
    app.config.defaults.prefix,
    /(?:\/([^\/\?]+?))/.source, // /:provider
    /(?:\/([^\/\?]+?))?/.source, // /:override?
    /(?:\/$|\/?\?+(.*))?$/.source, // querystring
  ].join(''), 'i')

  var _session = session(args.state)

  async function app (req, res, state) {
    var match = regex.exec(req.url)
    if (!match) {
      return
    }

    var {location, session, state} = await grant({
      method: req.method,
      params: {provider: match[1], override: match[2]},
      query: qs.parse(match[3]),
      body: req.method === 'POST' ? qs.parse(await buffer(req)) : {},
      state,
      session: (await _session.get(req, res)).grant
    })

    await _session.set(req, res, {grant: session})

    if (location) {
      res.statusCode = 302
      res.setHeader('location', location)
      res.end()
    }
    else {
      return {grant: state}
    }
  }

  return app
}

var buffer = (req, body = []) => new Promise((resolve, reject) => req
  .on('data', (chunk) => body.push(chunk))
  .on('end', () => resolve(Buffer.concat(body).toString('utf8')))
  .on('error', reject)
)
