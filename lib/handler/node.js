
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
    /(?:\/$|\/?\?+(.*))?$/.source, // querystring
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
      query: qs.parse(match[3]),
      body: req.method === 'POST' ? qs.parse(await buffer(req)) : {},
      state,
      session: (await _session.get()).grant
    })

    await _session.set({grant: session})

    if (location) {
      redirect(res, location)
    }
    return location ? {} : {state: {grant: state}}
  }

  return app
}

var buffer = (req, body = []) => new Promise((resolve, reject) => req
  .on('data', (chunk) => body.push(chunk))
  .on('end', () => resolve(Buffer.concat(body).toString('utf8')))
  .on('error', reject)
)

var redirect = (res, location) => {
  res.statusCode = 302
  res.setHeader('location', location)
  res.end()
}
