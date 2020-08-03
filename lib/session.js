
var crypto = require('crypto')
var cookie = require('cookie')
var signature = require('cookie-signature')


module.exports = ({name, secret, cookie:options, store}) => {
  name = name || 'grant'
  options = options || {path: '/', httpOnly: true, secure: false, maxAge: null}

  var embed = !store
  store = store || {get: async () => {}, set: async () => {}, remove: async () => {}}

  if (!secret) {
    throw new Error('Grant: cookie secret is required')
  }

  return (req, res) => {
    var headers = Object.keys(req.headers)
      .filter((key) => /(?:set-)?cookie/i.test(key))
      .reduce((all, key) => (all[key.toLowerCase()] = req.headers[key], all), {})

    headers['set-cookie'] =
      headers['set-cookie'] ||
      (req.multiValueHeaders && req.multiValueHeaders['Set-Cookie']) ||
      []

    var cookies = {
      input: cookie.parse(headers.cookie || ''),
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

    var decode = () => {
      var value = signature.unsign(cookies.input[name] || '', secret)
      if (!value) {
        return {grant: {}}
      }
      if (!embed) {
        return value
      }
      try {
        return JSON.parse(Buffer.from(value, 'base64').toString())
      }
      catch (err) {
        return {grant: {}}
      }
    }

    return {
      get: async () => {
        var value = decode()
        return typeof value === 'object' ? value
          : await store.get(value) || {grant: {}}
      },
      set: async (value) => {
        if (embed) {
          encode(value)
          return Promise.resolve()
        }
        else {
          var sid = signature.unsign(cookies.input[name] || '', secret)
            || crypto.randomBytes(20).toString('hex')
          encode(sid)
          return store.set(sid, value)
        }
      },
      remove: async () => {
        encode('', {maxAge: 0})
        if (!embed) {
          var sid = cookies.input[name]
          await store.remove(sid)
        }
      },
      cookies,
      headers,
    }
  }
}
