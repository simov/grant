
var t = require('assert')
var http = require('http')
var qs = require('qs')
var express = require('express')
var bodyParser = require('body-parser')
var Grant = require('../../').express()
var oauth1 = require('../../lib/flow/oauth1')


describe('oauth1', () => {
  var url = (path) => `http://localhost:5000${path}`

  describe('success', () => {
    var server

    before((done) => {
      server = http.createServer()
      server.on('request', (req, res) => {
        res.writeHead(200, {'content-type': 'application/x-www-form-urlencoded'})
        if (req.url === '/request_url') {
          var data = req.headers.authorization
            .replace('OAuth ', '').replace(/"/g, '').replace(/,/g, '&')
          res.end(data)
        }
        else if (req.url === '/access_url') {
          var data = qs.stringify({
            oauth_token: 'token', oauth_token_secret: 'secret', some: 'data'
          })
        }
        res.end(data)
      })
      server.listen(5000, done)
    })

    it('request', async () => {
      var provider = {
        request_url: url('/request_url'),
        redirect_uri: '/redirect_uri',
        key: 'key'
      }
      var {body} = await oauth1.request(provider)
      t.equal(body.oauth_callback, '/redirect_uri')
      t.equal(body.oauth_consumer_key, 'key')
    })

    it('authorize', async () => {
      var provider = {authorize_url: '/authorize_url'}
      var url = await oauth1.authorize(provider, {oauth_token: 'token'})
      t.deepEqual(
        qs.parse(url.replace('/authorize_url?', '')),
        {oauth_token: 'token'}
      )
    })

    it('access', async () => {
      var provider = {access_url: url('/access_url'), oauth: 1}
      var authorize = {oauth_token: 'token'}
      var data = await oauth1.access(provider, {}, authorize)
      t.deepEqual(
        data,
        {
          access_token: 'token',
          access_secret: 'secret',
          raw: {
            oauth_token: 'token',
            oauth_token_secret: 'secret',
            some: 'data'
          }
        }
      )
    })

    after((done) => {
      server.close(done)
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
      server.listen(5000, done)
    })

    it('request - request error', async () => {
      var provider = {request_url: 'compose:5000'}
      try {
        await oauth1.request(provider)
      }
      catch (err) {
        t.ok(/^Protocol "compose:" not supported\. Expected "http:"/.test(err.error))
      }
    })
    it('request - response error', async () => {
      var provider = {request_url: url('/request_url')}
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
      var provider = {access_url: 'compose:5000'}
      var authorize = {oauth_token: 'token'}
      try {
        await oauth1.access(provider, {}, authorize)
      }
      catch (err) {
        t.ok(/^Protocol "compose:" not supported\. Expected "http:"/.test(err.error))
      }
    })
    it('access - response error', async () => {
      var provider = {access_url: url('/access_url')}
      var authorize = {oauth_token: 'token'}
      try {
        await oauth1.access(provider, {}, authorize)
      }
      catch (err) {
        t.deepEqual(err.error, {error: 'invalid'})
      }
    })

    after((done) => {
      server.close(done)
    })
  })

  describe('custom', () => {
    describe('request', () => {
      var grant, server

      before((done) => {
        var config = {
          discogs: {}, etsy: {}, freshbooks: {}, getpocket: {},
          linkedin: {}
        }
        grant = new Grant(config)
        var app = express()
        app.use(bodyParser.urlencoded({extended: true}))
        app.use(grant)

        app.post('/request_url', (req, res) => {
          res.writeHead(200, {'content-type': 'application/x-www-form-urlencoded'})
          res.end(qs.stringify({
            agent: req.headers['user-agent'],
            oauth: req.headers.authorization,
            scope: req.query.scope,
            accept: req.headers['x-accept'],
            form: req.body
          }))
        })
        server = app.listen(5000, done)
      })

      describe('querystring scope', () => {
        it('etsy', async () => {
          grant.config.etsy.request_url = url('/request_url')
          grant.config.etsy.scope = 'email_r profile_r'
          var {body} = await oauth1.request(grant.config.etsy)
          t.equal(body.scope, 'email_r profile_r')
        })
        it('linkedin', async () => {
          grant.config.linkedin.request_url = url('/request_url')
          grant.config.linkedin.scope = 'scope1,scope2'
          var {body} = await oauth1.request(grant.config.linkedin)
          t.equal(body.scope, 'scope1,scope2')
        })
      })

      describe('user-agent', () => {
        it('discogs', async () => {
          grant.config.discogs.request_url = url('/request_url')
          var {body} = await oauth1.request(grant.config.discogs)
          t.equal(body.agent, 'Grant')
        })
      })

      describe('signature_method', () => {
        it('freshbooks', async () => {
          grant.config.freshbooks.request_url = url('/request_url')
          var {body} = await oauth1.request(grant.config.freshbooks)
          t.ok(/oauth_signature_method="PLAINTEXT"/.test(body.oauth))
        })
      })

      describe('getpocket', () => {
        it('access', async () => {
          grant.config.getpocket.request_url = url('/request_url')
          grant.config.getpocket.key = 'key'
          grant.config.getpocket.state = 'state'
          var {body} = await oauth1.request(grant.config.getpocket)
          t.deepEqual(body, {
            accept: 'application/x-www-form-urlencoded',
            form: {
              consumer_key: 'key',
              redirect_uri: ':///connect/getpocket/callback',
              state: 'state'
            }
          })
        })
      })

      describe('subdomain', () => {
        it('freshbooks', async () => {
          grant.config.freshbooks.request_url = url('/[subdomain]')
          grant.config.freshbooks.subdomain = 'request_url'
          var {body} = await oauth1.request(grant.config.freshbooks)
          t.ok(/OAuth/.test(body.oauth))
        })
      })

      after((done) => {
        server.close(done)
      })
    })

    describe('authorize', () => {
      var grant

      before(() => {
        var config = {
          flickr: {}, freshbooks: {}, getpocket: {}, ravelry: {}, trello: {},
          tripit: {}
        }
        grant = new Grant(config)
      })

      describe('custom_parameters', () => {
        it('trello', async () => {
          grant.config.trello.custom_params = {expiration: 'never', name: 'Grant'}
          var url = await oauth1.authorize(grant.config.trello, {oauth_token: 'token'})
          var query = qs.parse(url.split('?')[1])
          t.deepEqual(
            query,
            {oauth_token: 'token', expiration: 'never', name: 'Grant'}
          )
        })
      })

      describe('scope', () => {
        it('flickr', async () => {
          grant.config.flickr.scope = ['read', 'write']
          var url = await oauth1.authorize(grant.config.flickr, {oauth_token: 'token'})
          var query = qs.parse(url.split('?')[1])
          t.deepEqual(
            query,
            {oauth_token: 'token', perms: ['read', 'write']}
          )
        })

        it('ravelry', async () => {
          grant.config.ravelry.scope = ['read', 'write']
          var url = await oauth1.authorize(grant.config.ravelry, {oauth_token: 'token'})
          var query = qs.parse(url.split('?')[1])
          t.deepEqual(
            query,
            {oauth_token: 'token', scope: ['read', 'write']}
          )
        })

        it('trello', async () => {
          grant.config.trello.custom_params = {expiration: 'never', name: 'Grant'}
          grant.config.trello.scope = ['read', 'write']
          var url = await oauth1.authorize(grant.config.trello, {oauth_token: 'token'})
          var query = qs.parse(url.split('?')[1])
          t.deepEqual(
            query,
            {oauth_token: 'token', scope: ['read', 'write'], expiration: 'never', name: 'Grant'}
          )
        })
      })

      describe('oauth_callback', () => {
        it('tripit', async () => {
          grant.config.tripit.redirect_uri = url('/connect/tripit/callback')
          var uri = await oauth1.authorize(grant.config.tripit, {oauth_token: 'token'})
          var query = qs.parse(uri.split('?')[1])
          t.deepEqual(
            query,
            {oauth_token: 'token', oauth_callback: url('/connect/tripit/callback')}
          )
        })
      })

      describe('getpocket', () => {
        it('authorize', async () => {
          var url = await oauth1.authorize(grant.config.getpocket, {code: 'code'})
          var query = qs.parse(url.split('?')[1])
          t.deepEqual(query, {
            redirect_uri: ':///connect/getpocket/callback',
            request_token: 'code'
          })
        })
      })

      describe('subdomain', () => {
        it('freshbooks', async () => {
          grant.config.freshbooks.subdomain = 'grant'
          var url = await oauth1.authorize(grant.config.freshbooks, {oauth_token: 'token'})
          t.equal(url.indexOf('https://grant.freshbooks.com'), 0)
        })
      })
    })

    describe('access', () => {
      var grant, server

      before((done) => {
        var config = {
          discogs: {}, freshbooks: {}, getpocket: {}, goodreads: {}, intuit: {},
          tripit: {}
        }
        grant = new Grant(config)
        var app = express()
        app.use(bodyParser.urlencoded({extended: true}))
        app.use(grant)

        app.post('/access_url', (req, res) => {
          res.writeHead(200, {'content-type': 'application/x-www-form-urlencoded'})
          res.end(qs.stringify({
            agent: req.headers['user-agent'],
            oauth: req.headers.authorization,
            accept: req.headers['x-accept'],
            form: req.body
          }))
        })
        server = app.listen(5000, done)
      })

      describe('user-agent', () => {
        it('discogs', async () => {
          grant.config.discogs.access_url = url('/access_url')
          var authorize = {oauth_token: 'token'}
          var data = await oauth1.access(grant.config.discogs, {}, authorize)
          t.equal(data.raw.agent, 'Grant')
        })
      })

      describe('signature_method', () => {
        it('freshbooks', async () => {
          grant.config.freshbooks.access_url = url('/access_url')
          var authorize = {oauth_token: 'token'}
          var data = await oauth1.access(grant.config.freshbooks, {}, authorize)
          t.ok(/oauth_signature_method="PLAINTEXT"/.test(data.raw.oauth))
        })
      })

      describe('oauth_verifier', () => {
        it('goodreads', async () => {
          grant.config.goodreads.access_url = url('/access_url')
          var authorize = {oauth_token: 'token'}
          var data = await oauth1.access(grant.config.goodreads, {}, authorize)
          t.ok(!/verifier/.test(data.raw.oauth))
        })
        it('tripit', async () => {
          grant.config.tripit.access_url = url('/access_url')
          var authorize = {oauth_token: 'token'}
          var data = await oauth1.access(grant.config.tripit, {}, authorize)
          t.ok(!/verifier/.test(data.raw.oauth))
        })
      })

      describe('getpocket', () => {
        it('token', async () => {
          grant.config.getpocket.access_url = url('/access_url')
          grant.config.getpocket.key = 'key'
          var request = {code: 'code'}
          var data = await oauth1.access(grant.config.getpocket, request, {})
          t.deepEqual(data.raw, {
            accept: 'application/x-www-form-urlencoded',
            form: {
              consumer_key: 'key',
              code: 'code'
            }
          })
        })
      })

      describe('subdomain', () => {
        it('freshbooks', async () => {
          grant.config.freshbooks.access_url = url('/[subdomain]')
          grant.config.freshbooks.subdomain = 'access_url'
          var data = await oauth1.access(grant.config.freshbooks, {}, {oauth_token: 'token'})
          t.ok(/oauth_signature_method="PLAINTEXT"/.test(data.raw.oauth))
        })
      })

      describe('realmId', () => {
        it('intuit', async () => {
          grant.config.intuit.access_url = url('/access_url')
          var authorize = {oauth_token: 'token', realmId: '123'}
          var data = await oauth1.access(grant.config.intuit, {}, authorize)
          t.equal(data.raw.realmId, '123')
        })
      })

      after((done) => {
        server.close(done)
      })
    })
  })
})
