
var qs = require('qs')
var signature = require('cookie-signature')
var Grant = require('../grant')
var electron = require('electron')


module.exports = function (args = {}) {
  var grant = Grant(args.config ? args : {config: args})
  app.config = grant.config

  if (!(args.session && args.session.secret)) {
    throw new Error('Grant: cookie secret is required')
  }

  var regex = new RegExp([
    '^',
    app.config.defaults.prefix,
    /(?:\/([^\/\?]+?))/.source, // /:provider
    /(?:\/([^\/\?]+?))?/.source, // /:override?
    /(?:\/$|\/?\?+(.*))?$/.source, // querystring
  ].join(''), 'i')

  var name = name || 'grant'
  var secret = args.session.secret

  var store = (data) => {
    return {
      get: async () => data,
      set: async (value) => data = value,
      remove: async () => data = {}
    }
  }

  async function app (details, callback) {
    var cookies = await electron.session.defaultSession.cookies.get({
      url: details.url,
      name
    })
    var payload = signature.unsign(Object.fromEntries(cookies.map(({name, value}) => [name, value]))[name] || '', secret)
    var data;
    try {
      data = JSON.parse(Buffer.from(payload, 'base64').toString())
    }
    catch (err) {
      data = {grant: {}}
    }
    var session = store(data)

    var match = regex.exec(details.url.substring(new URL(details.url).origin.length))
    if (!match) {
      callback({})
      return {session}
    }

    var {location, session:sess, state} = await grant({
      method: details.method,
      params: {provider: match[1], override: match[2]},
      query: qs.parse(match[3]),
      body: details.method === 'POST' ? qs.parse(await buffer(details)) : {},
      state: {},
      session: (await session.get()).grant
    })

    await session.set({grant: sess})

    if (location) {
      var data = Buffer.from(JSON.stringify(await session.get())).toString('base64')
      await electron.session.defaultSession.cookies.set({
        url: details.url,
        name,
        value: signature.sign(data, secret)
      })
      callback({redirectURL: location})
      return {session, redirect: location, provider: match[1]}
    }
    callback({})
    return {session, response: state.response || sess.response}
  }

  return app
}

var buffer = (details) => {
  var body = '';
  for (var chunk in details.uploadData) {
    body += chunk.bytes.toString()
  }
  return body
}
