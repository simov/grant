
var crypto = require('crypto')


var base64url = (str) =>
  str.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

var kid = (jwk) => {
  if (jwk.kid) {
    return jwk.kid
  }
  var keys =
    jwk.kty === 'RSA' ? {e: jwk.e, kty: jwk.kty, n: jwk.n} :
    jwk.kty === 'EC' ? {crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y} :
    jwk.kty === 'oct' ? {k: jwk.k, kty: jwk.kty} : undefined
  return keys
    ? base64url(crypto.createHash('sha256').update(JSON.stringify(keys)).digest())
    : undefined
}

var x5t = (cert) => {
  var s1 = cert.replace(/(?:-----(?:BEGIN|END) CERTIFICATE-----|\s)/g, '')
  var s2 = Buffer.from(s1, 'base64')
  var s3 = crypto.createHash('sha1').update(s2).digest('hex').toUpperCase()
  return base64url(Buffer.from(s3, 'hex'))
}

var pem = (jwk) => {
  var pem = require('jwk-to-pem')
  return pem(jwk, {private: true})
}

var sign = (jwt) => {
  var jws = require('jws')
  return jws.sign(jwt)
}

var jwt = (str) => {
  var [header, payload, signature] = str.split('.')
  return {
    header: JSON.parse(Buffer.from(header, 'base64').toString('binary')),
    payload: JSON.parse(Buffer.from(payload, 'base64').toString('utf8')),
    signature,
  }
}

module.exports = {base64url, kid, x5t, pem, sign, jwt}
