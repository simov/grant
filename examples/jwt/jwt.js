
var fs = require('fs')
var path = require('path')
var jws = require('jws')

var key = {
  public: fs.readFileSync(path.resolve(__dirname, './public.pem'), 'utf8'),
  private: fs.readFileSync(path.resolve(__dirname, './private.pem'), 'utf8')
}


exports.sign = (user) => {
  var epoch = Math.floor(new Date().getTime() / 1000)

  var options = {
    header: {
      alg: 'RS256',
      typ: 'JWT'
    },
    payload: {
      // issuer
      iss: 'Grant',
      // expiration
      exp: epoch + (3600 * 24 * 365), // 1 year
      // subject
      sub: JSON.stringify(user),
      // audience
      aud: 'Grant',
      // issued at
      iat: epoch
    },
    secret: key.private
  }

  return jws.sign(options)
}

exports.verify = (signature) => {
  return jws.verify(signature, 'RS256', key.public)
}
