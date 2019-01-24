
var t = require('assert')
var verify = require('../lib/id_token')
var Grant = require('../').express()

var sign = (...args) => args.map((arg, index) => index < 2
  ? Buffer.from(JSON.stringify(arg)).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  : arg).join('.')


describe('id_token', () => {

  it('invalid format', () => {
    var id_token = sign('a', 'b')
    var {error} = verify({}, {id_token})
    t.equal(
      error,
      'Grant: OpenID Connect invalid id_token format'
    )
  })

  it('error decoding', () => {
    var id_token = 'a.b.c'
    var {error} = verify({}, {id_token})
    t.equal(
      error,
      'Grant: OpenID Connect error decoding id_token'
    )
  })

  it('invalid audience - string', () => {
    var id_token = sign({}, {aud: 'grant'}, 'c')
    var {error} = verify({key: 'simov'}, {id_token})
    t.equal(
      error,
      'Grant: OpenID Connect invalid id_token audience'
    )
  })

  it('invalid audience - array', () => {
    var id_token = sign({}, {aud: ['grant']}, 'c')
    var {error} = verify({key: 'simov'}, {id_token})
    t.equal(
      error,
      'Grant: OpenID Connect invalid id_token audience'
    )
  })

  it('valid audience - array', () => {
    var id_token = sign({}, {aud: ['grant']}, 'c')
    var {error} = verify({key: 'grant'}, {id_token})
    t.equal(error, undefined)
  })

  it('nonce mismatch', () => {
    var id_token = sign({}, {aud: 'grant', nonce: 'foo'}, 'c')
    var {error} = verify({key: 'grant'}, {id_token}, {nonce: 'bar'})
    t.equal(
      error,
      'Grant: OpenID Connect nonce mismatch'
    )
  })

  it('valid jwt', () => {
    var id_token = sign({typ: 'JWT'}, {aud: 'grant', nonce: 'foo'}, 'signature')
    var jwt = verify({key: 'grant'}, {id_token}, {nonce: 'foo'})
    t.deepEqual(
      jwt, {
        header: {typ: 'JWT'},
        payload: {aud: 'grant', nonce: 'foo'},
        signature: 'signature',
      }
    )
  })
})
