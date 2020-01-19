
var t = require('assert')
var http = require('http')
var qs = require('qs')

var request = require('request-compose').extend({
  Request: {cookie: require('request-cookie').Request},
  Response: {cookie: require('request-cookie').Response},
}).client

var config = require('../../lib/config')
var oauth1 = require('../../lib/flow/oauth1')

var provider = Object.assign({}, require('../consumer/util/provider'), {
  // ...require('../consumer/util/provider'),
  port: 5000,
  url: (path) => `http://localhost:${provider.port}${path}`,
  server: null,
})
var client = Object.assign({}, require('../consumer/util/client'), {
  // ...require('../consumer/util/client'),
  port: 5001,
  url: (path) => `http://localhost:${client.port}${path}`,
  server: null, grant: null, app: null,
})


describe('oauth1', () => {
  before(async () => {
    provider.server = await provider.oauth1(provider.port)
    var defaults = {
      protocol: 'http',
      host: `localhost:${client.port}`,
      callback: client.url('/'),
    }
    var providers = [
      'etsy', 'flickr', 'freshbooks', 'getpocket', 'goodreads', 'intuit',
      'linkedin', 'ravelry', 'trello', 'tripit', 'twitter'
    ].reduce((all, name) => (all[name] = {
      request_url: provider.url(`/${name}/request_url`),
      authorize_url: provider.url(`/${name}/authorize_url`),
      access_url: provider.url(`/${name}/access_url`),
    }, all), {})
    ;({
      server: client.server,
      grant: client.grant,
      app: client.app,
    // } = await client.express({defaults, ...providers}, client.port))
    } = await client.express(Object.assign({defaults}, providers), client.port))
  })

  after((done) => {
    provider.server.close(() => client.server.close(done))
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
      client.grant.config.twitter.key = 'key'
      var {body: {response}} = await request({
        url: client.url('/connect/twitter'),
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
      client.grant.config.freshbooks.access_url = provider.url('/[subdomain]/access_url')
      client.grant.config.freshbooks.authorize_url = provider.url('/[subdomain]/authorize_url')
      client.grant.config.freshbooks.request_url = provider.url('/[subdomain]/request_url')
      client.grant.config.freshbooks.subdomain = 'freshbooks'
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
  })

  describe('custom', () => {
    it('etsy - request - querystring scope', async () => {
      provider.oauth1.request = ({query}) => {
        t.deepEqual(query, {scope: 'email_r profile_r'})
      }
      client.grant.config.etsy.scope = 'email_r profile_r'
      var {body: {response}} = await request({
        url: client.url('/connect/etsy'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
      })
    })

    it('linkedin - request - querystring scope', async () => {
      provider.oauth1.request = ({query}) => {
        t.deepEqual(query, {scope: 'scope1,scope2'})
      }
      client.grant.config.linkedin.scope = 'scope1,scope2'
      var {body: {response}} = await request({
        url: client.url('/connect/linkedin'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
      })
    })

    it('freshbooks - request/access - signature_method', async () => {
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

    it('getpocket - request/authorize/access - custom', async () => {
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
      client.grant.config.getpocket.key = 'key'
      client.grant.config.getpocket.state = 'state'
      var {body: {response}} = await request({
        url: client.url('/connect/getpocket'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        raw: {access_token: 'token'}
      })
    })

    it('goodreads - access - oauth_verifier', async () => {
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

    it('flickr - authorize - scope', async () => {
      provider.oauth1.authorize = ({query}) => {
        t.deepEqual(query, {perms: 'a,b', oauth_token: 'token'})
      }
      client.grant.config.flickr.scope = config.format.scope(
        // {...client.grant.config.flickr, scope: ['a', 'b']}
        Object.assign(client.grant.config.flickr, {scope: ['a', 'b']})
      )
      var {body: {response}} = await request({
        url: client.url('/connect/flickr'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
      })
    })

    it('intuit - access - realmId', async () => {
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

    it('ravelry - authorize - scope', async () => {
      provider.oauth1.authorize = ({query}) => {
        t.deepEqual(query, {scope: 'a b', oauth_token: 'token'})
      }
      client.grant.config.ravelry.scope = config.format.scope(
        // {...client.grant.config.ravelry, scope: ['a', 'b']}
        Object.assign(client.grant.config.ravelry, {scope: ['a', 'b']})
      )
      var {body: {response}} = await request({
        url: client.url('/connect/ravelry'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
      })
    })

    it('trello - authorize - scope', async () => {
      provider.oauth1.authorize = ({query}) => {
        t.deepEqual(query, {scope: 'a,b', oauth_token: 'token'})
      }
      client.grant.config.trello.scope = config.format.scope(
        // {...client.grant.config.trello, scope: ['a', 'b']}
        Object.assign(client.grant.config.trello, {scope: ['a', 'b']})
      )
      var {body: {response}} = await request({
        url: client.url('/connect/trello'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
      })
    })

    it('tripit - authorize - oauth_callback, access - oauth_verifier', async () => {
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
  })

  describe('error', () => {
    var server

    before((done) => {
      server = http.createServer()
      server.on('request', (req, res) => {
        res.writeHead(500, {'content-type': 'application/x-www-form-urlencoded'})
        res.end(qs.stringify({error: 'invalid'}))
      })
      server.listen(5005, done)
    })

    after((done) => {
      server.close(done)
    })

    it('request - request error', async () => {
      var provider = {request_url: 'compose:5005'}
      try {
        await oauth1.request(provider)
      }
      catch (err) {
        t.ok(/^Protocol "compose:" not supported\. Expected "http:"/.test(err.error))
      }
    })
    it('request - response error', async () => {
      var provider = {request_url: 'http://localhost:5005/request_url'}
      oauth1.request(provider).catch((err) => {
        t.deepEqual(err.error, {error: 'invalid'})
      })
    })

    it('authorize - mising oauth_token - response error', async () => {
      var provider = {}
      var request = {error: 'invalid'}
      try {
        await oauth1.authorize(provider, request)
      }
      catch (err) {
        t.deepEqual(
          err.error,
          {error: 'invalid'}
        )
      }
    })
    it('authorize - mising oauth_token - empty response', async () => {
      var provider = {}
      var request = {}
      try {
        await oauth1.authorize(provider, request)
      }
      catch (err) {
        t.deepEqual(
          err.error,
          {error: 'Grant: OAuth1 missing oauth_token parameter'}
        )
      }
    })

    it('access - mising oauth_token - response error', async () => {
      var provider = {}
      var authorize = {error: 'invalid'}
      try {
        await oauth1.access(provider, {}, authorize)
      }
      catch (err) {
        t.deepEqual(err.error, {error: 'invalid'})
      }
    })
    it('access - mising oauth_token - empty response', async () => {
      var provider = {}
      var authorize = {}
      try {
        await oauth1.access(provider, {}, authorize)
      }
      catch (err) {
        t.deepEqual(
          err,
          {error: 'Grant: OAuth1 missing oauth_token parameter'}
        )
      }
    })
    it('access - request error', async () => {
      var provider = {access_url: 'compose:5005'}
      var authorize = {oauth_token: 'token'}
      try {
        await oauth1.access(provider, {}, authorize)
      }
      catch (err) {
        t.ok(/^Protocol "compose:" not supported\. Expected "http:"/.test(err.error))
      }
    })
    it('access - response error', async () => {
      var provider = {access_url: 'http://localhost:5005/access_url'}
      var authorize = {oauth_token: 'token'}
      try {
        await oauth1.access(provider, {}, authorize)
      }
      catch (err) {
        t.deepEqual(err.error, {error: 'invalid'})
      }
    })
  })
})
