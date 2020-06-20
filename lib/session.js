
var crypto = require('crypto')
var cookie = require('cookie')
var signature = require('cookie-signature')


module.exports = (state) => {
  var name = state.options.name || 'grant'
  var secret = state.options.secret
  var options = state.options.cookie || {path: '/', httpOnly: true, secure: false, maxAge: null}

  if (!secret) {
    throw new Error('Grant: cookie secret is required')
  }

  var get = async (req, res) => {
    var sid = cookie.parse(req.headers.cookie || '')[name]

    if (sid) {
      var key = signature.unsign(sid, secret)
      var session = await state({get: key}) || {grant: {}}
      return session
    }
    else {
      // create
      var id = crypto.randomBytes(20).toString('hex')
      var sid = signature.sign(id, secret)
      var data = cookie.serialize(name, sid, options)
      var header = [].concat(res.getHeader('set-cookie'), data).filter(Boolean)
      res.setHeader('set-cookie', header)

      var session = {grant: {}}
      // saveUninitialized: true
      // await state({set: [id, session]})
      return session
    }
  }

  var set = async (req, res, session) => {
    var sid =
      cookie.parse(req.headers.cookie || '')[name] ||
      cookie.parse(res.getHeader('set-cookie').join(' '))[name]

    var key = signature.unsign(sid, secret)
    await state({set: [key, session]})
  }

  return {get, set}
}
