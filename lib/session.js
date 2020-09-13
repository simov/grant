
var crypto = require('crypto')
var cookie = require('cookie')
var signature = require('cookie-signature')


module.exports = ({name, secret, cookie:options, store}) => {
  name = name || 'grant'
  options = options || {path: '/', httpOnly: true, secure: false, maxAge: null}

  if (!secret) {
    throw new Error('Grant: cookie secret is required')
  }

  var embed = !store

  return (req) => {
    var headers = Object.keys(req.headers)
      .filter((key) => /(?:set-)?cookie/i.test(key))
      .reduce((all, key) => (all[key.toLowerCase()] = req.headers[key], all), {})

    headers['set-cookie'] =
      headers['set-cookie'] ||
      (req.multiValueHeaders && req.multiValueHeaders['Set-Cookie']) ||
      []

    var cookies = {
      input: cookie.parse(headers.cookie ? headers.cookie
        // if aws v2 event is used in a callback
        : req.cookies ? req.cookies.join('; ')
        : ''),
      output: headers['set-cookie'].reduce((all, str) =>
        (all[str.split(';')[0].split('=')[0]] = str, all), {})
    }

    var encode = (payload, opt = {}) => {
      var data = embed
        ? Buffer.from(JSON.stringify(payload)).toString('base64')
        : payload
      var value = signature.sign(data, secret)
      var output = cookie.serialize(name, value, {...options, ...opt})
      cookies.output[name] = output
      headers['set-cookie'] = Object.keys(cookies.output)
        .map((name) => cookies.output[name])
    }

    var cookieStore = () => {
      var session = (() => {
        var payload = signature.unsign(cookies.input[name] || '', secret)
        try {
          return JSON.parse(Buffer.from(payload, 'base64').toString())
        }
        catch (err) {
          return {grant: {}}
        }
      })()
      var store = {
        get: async (sid) => session,
        set: async (sid, value) => session = value,
        remove: async (sid) => session = {}
      }
      return {
        get: async () => {
          return store.get()
        },
        set: async (value) => {
          encode(value)
          return store.set(null, value)
        },
        remove: async () => {
          encode('', {maxAge: 0})
          await store.remove()
        },
        cookies,
        headers,
      }
    }

    var sessionStore = () => {
      var sid = signature.unsign(cookies.input[name] || '', secret)
        || crypto.randomBytes(20).toString('hex')
      return {
        get: async () => {
          return await store.get(sid) || {grant: {}}
        },
        set: async (value) => {
          encode(sid)
          return store.set(sid, value)
        },
        remove: async () => {
          encode(sid, {maxAge: 0})
          await store.remove(sid)
        },
        cookies,
        headers,
      }
    }

    return embed ? cookieStore() : sessionStore()
  }
}
