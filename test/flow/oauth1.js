
var t = require('assert')

var request = require('request-compose').extend({
  Request: {cookie: require('request-cookie').Request},
  Response: {cookie: require('request-cookie').Response},
}).client

var oauth = require('../../config/oauth')

var Provider = require('../consumer/util/provider'), provider
var Client = require('../consumer/util/client'), client


describe('oauth1', () => {
  before(async () => {
    provider = await Provider({flow: 'oauth1'})
    client = await Client({
      test: 'handlers',
      handler: 'express',
      config: {
        defaults: {
          origin: 'http://localhost:5001',
          callback: '/',
        },
        ...Object.keys(oauth).reduce((all, name) => (all[name] = {
          request_url: provider.url(`/${name}/request_url`),
          authorize_url: provider.url(`/${name}/authorize_url`),
          access_url: provider.url(`/${name}/access_url`),
          dynamic: true,
        }, all), {})
      }
    })
  })

  after(async () => {
    await client.close()
    await provider.close()
  })

  afterEach(() => {
    provider.oauth1.request = () => {}
    provider.oauth1.authorize = () => {}
    provider.oauth1.access = () => {}
  })

  describe('success', () => {
    it('twitter', async () => {
      provider.oauth1.request = ({url, headers, query, form, oauth}) => {
        t.equal(url, '/twitter/request_url')
        t.ok(/^simov\/grant/.test(headers['user-agent']))
        t.equal(typeof query, 'object')
        t.equal(typeof form, 'object')
        t.equal(oauth.oauth_signature_method, 'HMAC-SHA1')
        t.equal(oauth.oauth_consumer_key, 'key')
        t.equal(oauth.oauth_callback, 'http://localhost:5001/connect/twitter/callback')
      }
      provider.oauth1.authorize = ({url, headers, query}) => {
        t.equal(url, '/twitter/authorize_url?oauth_token=token')
        t.equal(typeof headers, 'object')
        t.deepEqual(query, {oauth_token: 'token'})
      }
      provider.oauth1.access = ({url, headers, query, form, oauth}) => {
        t.equal(url, '/twitter/access_url')
        t.ok(/^simov\/grant/.test(headers['user-agent']))
        t.equal(typeof query, 'object')
        t.equal(typeof form, 'object')
        t.equal(oauth.oauth_signature_method, 'HMAC-SHA1')
        t.equal(oauth.oauth_consumer_key, 'key')
        t.equal(oauth.oauth_token, 'token')
      }
      var {body: {response}} = await request({
        url: client.url('/connect/twitter'),
        qs: {key: 'key'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
      })
    })
  })

  describe('subdomain', () => {
    it('freshbooks', async () => {
      provider.oauth1.request = ({url, headers, query, form, oauth}) => {
        t.ok(url.startsWith('/freshbooks/request_url'))
      }
      provider.oauth1.authorize = ({url, headers, query}) => {
        t.ok(url.startsWith('/freshbooks/authorize_url'))
      }
      provider.oauth1.access = ({url, headers, query, form, oauth}) => {
        t.ok(url.startsWith('/freshbooks/access_url'))
      }
      var {body: {response}} = await request({
        url: client.url('/connect/freshbooks'),
        qs: {
          request_url: provider.url('/[subdomain]/request_url'),
          authorize_url: provider.url('/[subdomain]/authorize_url'),
          access_url: provider.url('/[subdomain]/access_url'),
          subdomain: 'freshbooks',
        },
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
      })
    })
  })

  describe('custom', () => {
    it('querystring scope - request - etsy', async () => {
      provider.oauth1.request = ({query}) => {
        t.deepEqual(query, {scope: 'email_r profile_r'})
      }
      var {body: {response}} = await request({
        url: client.url('/connect/etsy'),
        qs: {scope: 'email_r profile_r'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
      })
    })

    it('querystring scope - request - linkedin', async () => {
      provider.oauth1.request = ({query}) => {
        t.deepEqual(query, {scope: 'scope1,scope2'})
      }
      var {body: {response}} = await request({
        url: client.url('/connect/linkedin'),
        qs: {scope: 'scope1,scope2'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
      })
    })

    it('signature_method - request/access - freshbooks', async () => {
      provider.oauth1.request = ({headers}) => {
        t.ok(/oauth_signature_method="PLAINTEXT"/.test(headers.authorization))
      }
      provider.oauth1.access = ({headers}) => {
        t.ok(/oauth_signature_method="PLAINTEXT"/.test(headers.authorization))
      }
      var {body: {response}} = await request({
        url: client.url('/connect/freshbooks'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
      })
    })

    it('scope - authorize - flickr', async () => {
      provider.oauth1.authorize = ({query}) => {
        t.deepEqual(query, {perms: 'a,b', oauth_token: 'token'})
      }
      var {body: {response}} = await request({
        url: client.url('/connect/flickr'),
        qs: {scope: 'a,b'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
      })
    })

    it('scope - authorize - ravelry', async () => {
      provider.oauth1.authorize = ({query}) => {
        t.deepEqual(query, {scope: 'a b', oauth_token: 'token'})
      }
      var {body: {response}} = await request({
        url: client.url('/connect/ravelry'),
        qs: {scope: 'a b'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
      })
    })

    it('scope - authorize - trello', async () => {
      provider.oauth1.authorize = ({query}) => {
        t.deepEqual(query, {scope: 'a,b', oauth_token: 'token'})
      }
      var {body: {response}} = await request({
        url: client.url('/connect/trello'),
        qs: {scope: 'a,b'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
      })
    })

    it('custom_params - authorize - trello', async () => {
      provider.oauth1.authorize = ({query}) => {
        t.deepEqual(query, {oauth_token: 'token', name: 'grant'})
      }
      var {body: {response}} = await request({
        url: client.url('/connect/trello'),
        // request-compose:querystring can't handle nested objects
        qs: 'custom_params%5Bname%5D=grant',
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
      })
    })

    it('oauth_verifier - access - goodreads', async () => {
      provider.oauth1.access = ({oauth}) => {
        t.equal(oauth.oauth_verifier, undefined)
      }
      var {body: {response}} = await request({
        url: client.url('/connect/goodreads'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
      })
    })

    it('realmId - access - intuit', async () => {
      var {body: {response}} = await request({
        url: client.url('/connect/intuit'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret', realmId: '123'}
      })
    })

    it('oauth_callback - authorize, oauth_verifier - access - tripit', async () => {
      provider.oauth1.authorize = ({query}) => {
        t.deepEqual(query, {
          oauth_callback: 'http://localhost:5001/connect/tripit/callback',
          oauth_token: 'token'
        })
      }
      provider.oauth1.access = ({oauth}) => {
        t.equal(oauth.oauth_verifier, undefined)
      }
      var {body: {response}} = await request({
        url: client.url('/connect/tripit'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
      })
    })

    it('custom - request/authorize/access - getpocket', async () => {
      provider.oauth1.request = ({headers, form}) => {
        t.equal(headers['x-accept'], 'application/x-www-form-urlencoded')
        t.deepEqual(form, {
          consumer_key: 'key',
          state: 'state',
          redirect_uri: 'http://localhost:5001/connect/getpocket/callback',
        })
      }
      provider.oauth1.authorize = ({query}) => {
        t.deepEqual(query, {
          request_token: 'code',
          redirect_uri: 'http://localhost:5001/connect/getpocket/callback'
        })
      }
      provider.oauth1.access = ({headers, form}) => {
        t.equal(headers['x-accept'], 'application/x-www-form-urlencoded')
        t.deepEqual(form, {
          consumer_key: 'key',
          code: 'code'
        })
      }
      var {body: {response}} = await request({
        url: client.url('/connect/getpocket'),
        qs: {key: 'key', state: 'state'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        raw: {access_token: 'token'}
      })
    })
  })

  describe('error', () => {
    it('request - missing oauth_token with response message', async () => {
      var {body: {response}} = await request({
        url: client.url('/connect/twitter'),
        qs: {request_url: provider.url('/request_error_message')},
        cookie: {},
      })
      t.deepEqual(response, {error: {message: 'invalid'}})
    })

    it('request - missing oauth_token without response message', async () => {
      var {body: {response}} = await request({
        url: client.url('/connect/twitter'),
        qs: {request_url: provider.url('/request_error_token')},
        cookie: {},
      })
      t.deepEqual(response, {error: 'Grant: OAuth1 missing oauth_token parameter'})
    })

    it('authorize - mising oauth_token with response message', async () => {
      var {body: {response}} = await request({
        url: client.url('/connect/twitter'),
        qs: {authorize_url: provider.url('/authorize_error_message')},
        cookie: {},
      })
      t.deepEqual(response, {error: {message: 'invalid'}})
    })

    it('authorize - mising oauth_token without error message', async () => {
      var {body: {response}} = await request({
        url: client.url('/connect/twitter'),
        qs: {authorize_url: provider.url('/authorize_error_token')},
        cookie: {},
      })
      t.deepEqual(response, {error: 'Grant: OAuth1 missing oauth_token parameter'})
    })
  })
})
