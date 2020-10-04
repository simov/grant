
var t = require('assert')

var request = require('request-compose').extend({
  Request: {cookie: require('request-cookie').Request},
  Response: {cookie: require('request-cookie').Response},
}).client

var Provider = require('../util/provider'), provider
var Client = require('../util/client'), client

var qs = require('qs')
var jws = require('jws')
var oidc = require('../../lib/oidc')
var keys = require('../util/keys')


describe('oidc', () => {
  before(async () => {
    provider = await Provider({flow: 'oauth2'})
    var config = {
      defaults: {
        origin: 'http://localhost:5001', callback: '/',
      },
      oauth2: {
        authorize_url: provider.url('/oauth2/authorize_url'),
        access_url: provider.url('/oauth2/access_url'),
        profile_url: provider.url('/oauth2/profile_url'),
        oauth: 2,
        dynamic: true,
      }
    }
    client = await Client({test: 'handlers', handler: 'express', config})
  })

  after(async () => {
    await provider.close()
    await client.close()
    provider.on.authorize = () => {}
    provider.on.access = () => {}
  })

  var verify = ({form, alg}) => {
    t.equal(form.grant_type, 'authorization_code')
    t.equal(form.code, 'code')
    t.equal(form.redirect_uri, 'http://localhost:5001/connect/oauth2/callback')
    t.equal(form.client_assertion_type, 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer')

    var jwt = oidc.jwt(form.client_assertion)
    t.ok(jws.verify(form.client_assertion, jwt.header.alg, keys[alg].public_pem))

    t.equal(jwt.header.typ, 'JWT')
    t.equal(jwt.header.alg, alg)
    t.equal(jwt.payload.iss, 'client_id')
    t.equal(jwt.payload.iss, jwt.payload.sub)
    t.equal(jwt.payload.aud, 'http://localhost:5000/oauth2/access_url')
    t.equal(jwt.payload.jti.length, 40)
    t.equal(jwt.payload.exp, jwt.payload.iat + 420)
    t.equal(jwt.payload.iat, jwt.payload.nbf)
    t.ok(typeof jwt.signature === 'string')

    return jwt
  }

  var success = ({response}) => {
    t.deepEqual(response, {
      access_token: 'token',
      refresh_token: 'refresh',
      raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
    })
  }

  it('private pem - no kid', async () => {
    provider.on.access = ({form}) => {
      var jwt = verify({form, alg: 'RS256'})
      t.ok(jwt.header.kid === undefined, 'no pem-to-jwk convertion yet')
    }
    var {body: {response}} = await request({
      url: client.url('/connect/oauth2'),
      qs: {
        token_endpoint_auth_method: 'private_key_jwt',
        key: 'client_id',
        private_key: keys.RS256.private_pem,
      },
      cookie: {},
    })
    success({response})
  })

  it('private jwk - set kid', async () => {
    provider.on.access = ({form}) => {
      var jwt = verify({form, alg: 'RS256'})
      t.ok(typeof jwt.header.kid === 'string', 'should pick the kid from the jwk')
    }
    var {body: {response}} = await request({
      url: client.url('/connect/oauth2'),
      qs: qs.stringify({
        token_endpoint_auth_method: 'private_key_jwt',
        key: 'client_id',
        private_key: keys.RS256.private_jwk,
      }),
      cookie: {},
    })
    success({response})
  })

  it('private jwk - generate kid', async () => {
    delete keys.RS256.private_jwk.kid
    provider.on.access = ({form}) => {
      var jwt = verify({form, alg: 'RS256'})
      t.ok(typeof jwt.header.kid === 'string', 'should generate the kid out of the jwk')
    }
    var {body: {response}} = await request({
      url: client.url('/connect/oauth2'),
      qs: qs.stringify({
        token_endpoint_auth_method: 'private_key_jwt',
        key: 'client_id',
        private_key: keys.RS256.private_jwk,
      }),
      cookie: {},
    })
    success({response})
  })

  it('public pem - generate x5t', async () => {
    provider.on.access = ({form}) => {
      var jwt = verify({form, alg: 'RS256'})
      t.ok(jwt.header.kid === undefined, 'no pem-to-jwk convertion yet')
      t.ok(typeof jwt.header.x5t === 'string', 'should generate x5t out of the pem')
    }
    var {body: {response}} = await request({
      url: client.url('/connect/oauth2'),
      qs: {
        token_endpoint_auth_method: 'private_key_jwt',
        key: 'client_id',
        public_key: keys.RS256.public_pem,
        private_key: keys.RS256.private_pem,
      },
      cookie: {},
    })
    success({response})
  })

  it('public jwk - set x5t', async () => {
    provider.on.access = ({form}) => {
      var jwt = verify({form, alg: 'RS256'})
      t.ok(jwt.header.kid === undefined, 'no pem-to-jwk convertion yet')
      t.ok(typeof jwt.header.x5t === 'string', 'should pick the x5t from the jwk')
    }
    var {body: {response}} = await request({
      url: client.url('/connect/oauth2'),
      qs: qs.stringify({
        token_endpoint_auth_method: 'private_key_jwt',
        key: 'client_id',
        public_key: keys.RS256.public_jwk,
        private_key: keys.RS256.private_pem,
      }),
      cookie: {},
    })
    success({response})
  })

  it('token alg - ES256', async () => {
    provider.on.access = ({form}) => {
      var jwt = verify({form, alg: 'ES256'})
      t.ok(jwt.header.kid === undefined, 'no pem-to-jwk convertion yet')
    }
    var {body: {response}} = await request({
      url: client.url('/connect/oauth2'),
      qs: {
        token_endpoint_auth_method: 'private_key_jwt',
        token_endpoint_auth_signing_alg: 'ES256',
        key: 'client_id',
        private_key: keys.ES256.private_pem,
      },
      cookie: {},
    })
    success({response})
  })

  it('token alg - PS256', async () => {
    provider.on.access = ({form}) => {
      var jwt = verify({form, alg: 'PS256'})
      t.ok(jwt.header.kid === undefined, 'no pem-to-jwk convertion yet')
    }
    var {body: {response}} = await request({
      url: client.url('/connect/oauth2'),
      qs: {
        token_endpoint_auth_method: 'private_key_jwt',
        token_endpoint_auth_signing_alg: 'PS256',
        key: 'client_id',
        private_key: keys.PS256.private_pem,
      },
      cookie: {},
    })
    success({response})
  })

})
