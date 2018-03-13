'use strict'

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
        if (req.url === '/request_url') {
          var data = req.headers.authorization
            .replace('OAuth ', '').replace(/"/g, '').replace(/,/g, '&')
          res.end(data)
        }
        else if (req.url === '/access_url') {
          res.end(qs.stringify({
            oauth_token: 'token', oauth_token_secret: 'secret', some: 'data'
          }))
        }
      })
      server.listen(5000, done)
    })

    it('request', (done) => {
      var provider = {
        request_url: url('/request_url'),
        redirect_uri: '/redirect_uri',
        key: 'key'
      }
      oauth1.request(provider, (err, data) => {
        t.equal(data.oauth_callback, '/redirect_uri')
        t.equal(data.oauth_consumer_key, 'key')
        done()
      })
    })

    it('authorize', () => {
      var provider = {authorize_url: '/authorize_url'}
      var url = oauth1.authorize(provider, {oauth_token: 'token'})
      t.deepEqual(qs.parse(url.replace('/authorize_url?', '')),
        {oauth_token: 'token'})
    })

    it('access', (done) => {
      var provider = {access_url: url('/access_url'), oauth: 1}
      var authorize = {oauth_token: 'token'}
      oauth1.access(provider, {}, authorize, (err, data) => {
        t.deepEqual(qs.parse(data), {
          oauth_token: 'token',
          oauth_token_secret: 'secret',
          some: 'data'
        })
        done()
      })
    })

    it('callback', () => {
      var provider = {oauth: 1}
      var authorize = {
        oauth_token: 'token',
        oauth_token_secret: 'secret',
        some: 'data'
      }
      var url = oauth1.callback(provider, authorize)
      t.deepEqual(qs.parse(url), {
        access_token: 'token',
        access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret', some: 'data'}
      })
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
        res.writeHead(500)
        res.end(qs.stringify({error: 'invalid'}))
      })
      server.listen(5000, done)
    })

    it('request - request error', (done) => {
      var provider = {request_url: '/request_url'}
      oauth1.request(provider, (err, body) => {
        t.deepEqual(qs.parse(err), {error: {error: 'socket hang up'}})
        done()
      })
    })
    it('request - response error', (done) => {
      var provider = {request_url: url('/request_url')}
      oauth1.request(provider, (err, body) => {
        t.deepEqual(qs.parse(err), {error: {error: 'invalid'}})
        done()
      })
    })

    it('authorize - mising oauth_token - response error', () => {
      var provider = {}
      var request = {error: 'invalid'}
      var url = oauth1.authorize(provider, request)
      t.deepEqual(qs.parse(url.replace('/?', '')),
        {error: {error: 'invalid'}})
    })
    it('authorize - mising oauth_token - empty response', () => {
      var provider = {}
      var request = {}
      var url = oauth1.authorize(provider, request)
      t.deepEqual(qs.parse(url.replace('/?', '')),
        {error: {error: 'Grant: OAuth1 missing oauth_token parameter'}})
    })

    it('access - mising oauth_token - response error', (done) => {
      var provider = {}
      var authorize = {error: 'invalid'}
      oauth1.access(provider, {}, authorize, (err, body) => {
        t.deepEqual(qs.parse(err), {error: {error: 'invalid'}})
        done()
      })
    })
    it('access - mising oauth_token - empty response', (done) => {
      var provider = {}
      var authorize = {}
      oauth1.access(provider, {}, authorize, (err, body) => {
        t.deepEqual(qs.parse(err),
          {error: {error: 'Grant: OAuth1 missing oauth_token parameter'}})
        done()
      })
    })
    it('access - request error', (done) => {
      var provider = {access_url: '/access_url'}
      var authorize = {oauth_token: 'token'}
      oauth1.access(provider, {}, authorize, (err, body) => {
        t.deepEqual(qs.parse(err), {error: {error: 'socket hang up'}})
        done()
      })
    })
    it('access - response error', (done) => {
      var provider = {access_url: url('/access_url')}
      var authorize = {oauth_token: 'token'}
      oauth1.access(provider, {}, authorize, (err, body) => {
        t.deepEqual(qs.parse(err), {error: {error: 'invalid'}})
        done()
      })
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
          copy: {}, discogs: {}, etsy: {}, freshbooks: {}, getpocket: {},
          linkedin: {}
        }
        grant = new Grant(config)
        var app = express()
        app.use(bodyParser.urlencoded({extended: true}))
        app.use(grant)

        app.post('/request_url', (req, res) => {
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
        it('copy', (done) => {
          grant.config.copy.request_url = url('/request_url')
          grant.config.copy.scope = '{"profile":{"read":true}}'
          oauth1.request(grant.config.copy, (err, body) => {
            t.equal(body.scope, '{"profile":{"read":true}}')
            done()
          })
        })
        it('etsy', (done) => {
          grant.config.etsy.request_url = url('/request_url')
          grant.config.etsy.scope = 'email_r profile_r'
          oauth1.request(grant.config.etsy, (err, body) => {
            t.equal(body.scope, 'email_r profile_r')
            done()
          })
        })
        it('linkedin', (done) => {
          grant.config.linkedin.request_url = url('/request_url')
          grant.config.linkedin.scope = 'scope1,scope2'
          oauth1.request(grant.config.linkedin, (err, body) => {
            t.equal(body.scope, 'scope1,scope2')
            done()
          })
        })
      })

      describe('user-agent', () => {
        it('discogs', (done) => {
          grant.config.discogs.request_url = url('/request_url')
          oauth1.request(grant.config.discogs, (err, body) => {
            t.equal(body.agent, 'Grant')
            done()
          })
        })
      })

      describe('signature_method', () => {
        it('freshbooks', (done) => {
          grant.config.freshbooks.request_url = url('/request_url')
          oauth1.request(grant.config.freshbooks, (err, body) => {
            t.ok(/oauth_signature_method="PLAINTEXT"/.test(body.oauth))
            done()
          })
        })
      })

      describe('getpocket', () => {
        it('access', (done) => {
          grant.config.getpocket.request_url = url('/request_url')
          grant.config.getpocket.key = 'key'
          grant.config.getpocket.state = 'state'
          oauth1.request(grant.config.getpocket, (err, body) => {
            t.deepEqual(body, {
              accept: 'application/x-www-form-urlencoded',
              form: {
                consumer_key: 'key',
                redirect_uri: ':///connect/getpocket/callback',
                state: 'state'
              }
            })
            done()
          })
        })
      })

      describe('subdomain', () => {
        it('freshbooks', (done) => {
          grant.config.freshbooks.request_url = url('/[subdomain]')
          grant.config.freshbooks.subdomain = 'request_url'
          oauth1.request(grant.config.freshbooks, (err, body) => {
            t.ok(/OAuth/.test(body.oauth))
            done()
          })
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
        it('trello', () => {
          grant.config.trello.custom_params = {expiration: 'never', name: 'Grant'}
          var url = oauth1.authorize(grant.config.trello, {oauth_token: 'token'})
          var query = qs.parse(url.split('?')[1])
          t.deepEqual(query,
            {oauth_token: 'token', expiration: 'never', name: 'Grant'})
        })
      })

      describe('scope', () => {
        it('flickr', () => {
          grant.config.flickr.scope = ['read', 'write']
          var url = oauth1.authorize(grant.config.flickr, {oauth_token: 'token'})
          var query = qs.parse(url.split('?')[1])
          t.deepEqual(query,
            {oauth_token: 'token', perms: ['read', 'write']})
        })

        it('ravelry', () => {
          grant.config.ravelry.scope = ['read', 'write']
          var url = oauth1.authorize(grant.config.ravelry, {oauth_token: 'token'})
          var query = qs.parse(url.split('?')[1])
          t.deepEqual(query,
            {oauth_token: 'token', scope: ['read', 'write']})
        })

        it('trello', () => {
          grant.config.trello.custom_params = {expiration: 'never', name: 'Grant'}
          grant.config.trello.scope = ['read', 'write']
          var url = oauth1.authorize(grant.config.trello, {oauth_token: 'token'})
          var query = qs.parse(url.split('?')[1])
          t.deepEqual(query,
            {oauth_token: 'token', scope: ['read', 'write'], expiration: 'never', name: 'Grant'})
        })
      })

      describe('oauth_callback', () => {
        it('tripit', () => {
          grant.config.tripit.redirect_uri = url('/connect/tripit/callback')
          var uri = oauth1.authorize(grant.config.tripit, {oauth_token: 'token'})
          var query = qs.parse(uri.split('?')[1])
          t.deepEqual(query,
            {oauth_token: 'token', oauth_callback: url('/connect/tripit/callback')})
        })
      })

      describe('getpocket', () => {
        it('authorize', () => {
          var url = oauth1.authorize(grant.config.getpocket, {code: 'code'})
          var query = qs.parse(url.split('?')[1])
          t.deepEqual(query, {
            redirect_uri: ':///connect/getpocket/callback',
            request_token: 'code'
          })
        })
      })

      describe('subdomain', () => {
        it('freshbooks', () => {
          grant.config.freshbooks.subdomain = 'grant'
          var url = oauth1.authorize(grant.config.freshbooks, {oauth_token: 'token'})
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
        it('discogs', (done) => {
          grant.config.discogs.access_url = url('/access_url')
          var authorize = {oauth_token: 'token'}
          oauth1.access(grant.config.discogs, {}, authorize, (err, data) => {
            var query = qs.parse(data)
            t.equal(query.agent, 'Grant')
            done()
          })
        })
      })

      describe('signature_method', () => {
        it('freshbooks', (done) => {
          grant.config.freshbooks.access_url = url('/access_url')
          var authorize = {oauth_token: 'token'}
          oauth1.access(grant.config.freshbooks, {}, authorize, (err, data) => {
            var query = qs.parse(data)
            t.ok(/oauth_signature_method="PLAINTEXT"/.test(query.oauth))
            done()
          })
        })
      })

      describe('oauth_verifier', () => {
        it('goodreads', (done) => {
          grant.config.goodreads.access_url = url('/access_url')
          var authorize = {oauth_token: 'token'}
          oauth1.access(grant.config.goodreads, {}, authorize, (err, data) => {
            var query = qs.parse(data)
            t.ok(!/verifier/.test(query.oauth))
            done()
          })
        })
        it('tripit', (done) => {
          grant.config.tripit.access_url = url('/access_url')
          var authorize = {oauth_token: 'token'}
          oauth1.access(grant.config.tripit, {}, authorize, (err, data) => {
            var query = qs.parse(data)
            t.ok(!/verifier/.test(query.oauth))
            done()
          })
        })
      })

      describe('getpocket', () => {
        it('token', (done) => {
          grant.config.getpocket.access_url = url('/access_url')
          grant.config.getpocket.key = 'key'
          var request = {code: 'code'}
          oauth1.access(grant.config.getpocket, request, {}, (err, response) => {
            var query = qs.parse(response)
            t.deepEqual(query, {
              accept: 'application/x-www-form-urlencoded',
              form: {
                consumer_key: 'key',
                code: 'code'
              }
            })
            done()
          })
        })
      })

      describe('subdomain', () => {
        it('freshbooks', (done) => {
          grant.config.freshbooks.access_url = url('/[subdomain]')
          grant.config.freshbooks.subdomain = 'access_url'
          oauth1.access(grant.config.freshbooks, {}, {oauth_token: 'token'}, (err, url) => {
            t.ok(typeof url === 'string')
            done()
          })
        })
      })

      describe('realmId', () => {
        it('intuit', (done) => {
          grant.config.intuit.access_url = url('/access_url')
          var authorize = {oauth_token: 'token', realmId: '123'}
          oauth1.access(grant.config.intuit, {}, authorize, (err, data) => {
            var query = qs.parse(data)
            t.equal(query.realmId, '123')
            done()
          })
        })
      })

      after((done) => {
        server.close(done)
      })
    })
  })
})
