'use strict'

var t = require('assert')
var http = require('http')
var qs = require('qs')
var express = require('express')
var bodyParser = require('body-parser')
var Grant = require('../../').express()
var oauth2 = require('../../lib/flow/oauth2')
var oauth = require('../../config/oauth')


describe('oauth2', () => {
  var url = (path) => `http://localhost:5000${path}`

  describe('success', () => {
    var server

    before((done) => {
      server = http.createServer()
      server.on('request', (req, res) => {
        req.pipe(res)
      })
      server.listen(5000, done)
    })

    it('authorize', () => {
      var provider = {
        authorize_url: '/authorize_url',
        redirect_uri: '/redirect_uri',
        key: 'key',
        scope: 'read,write',
        state: '123'
      }
      var url = oauth2.authorize(provider)
      t.deepEqual(qs.parse(url.replace('/authorize_url?', '')), {
        client_id: 'key',
        response_type: 'code',
        redirect_uri: '/redirect_uri',
        scope: 'read,write',
        state: '123'
      })
    })

    it('access', (done) => {
      var provider = {
        access_url: url('/access_url'),
        redirect_uri: '/redirect_uri',
        key: 'key',
        secret: 'secret'
      }
      var authorize = {
        code: 'code'
      }
      oauth2.access(provider, authorize, {}, (err, body) => {
        t.deepEqual(qs.parse(body), {
          grant_type: 'authorization_code',
          code: 'code',
          client_id: 'key',
          client_secret: 'secret',
          redirect_uri: '/redirect_uri'
        })
        done()
      })
    })

    it('callback', () => {
      var provider = {
        access_url: '/access_url',
        oauth: 2
      }
      var access = {
        access_token: 'token',
        refresh_token: 'refresh',
        some: 'data'
      }
      var url = oauth2.callback(provider, access)
      t.deepEqual(qs.parse(url), {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', some: 'data'}
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

    it('access - missing code - response error', (done) => {
      var provider = {}
      var authorize = {error: 'invalid'}
      oauth2.access(provider, authorize, {}, (err, body) => {
        t.deepEqual(qs.parse(err), {error: {error: 'invalid'}})
        done()
      })
    })
    it('access - missing code - empty response', (done) => {
      var provider = {}
      var authorize = {}
      oauth2.access(provider, authorize, {}, (err, body) => {
        t.deepEqual(qs.parse(err),
          {error: {error: 'Grant: OAuth2 missing code parameter'}})
        done()
      })
    })
    it('access - state mismatch', (done) => {
      var provider = {}
      var authorize = {code: 'code', state: 'Purest'}
      var session = {state: 'Grant'}
      oauth2.access(provider, authorize, session, (err, body) => {
        t.deepEqual(qs.parse(err), {error: {error: 'Grant: OAuth2 state mismatch'}})
        done()
      })
    })
    it('access - request error', (done) => {
      var provider = {access_url: '/access_url'}
      var authorize = {code: 'code'}
      oauth2.access(provider, authorize, {}, (err, body) => {
        t.deepEqual(qs.parse(err), {error: {error: 'socket hang up'}})
        done()
      })
    })
    it('access - response error', (done) => {
      var provider = {access_url: url('/access_url')}
      var authorize = {code: 'code'}
      oauth2.access(provider, authorize, {}, (err, body) => {
        t.deepEqual(qs.parse(err), {error: {error: 'invalid'}})
        done()
      })
    })

    after((done) => {
      server.close(done)
    })
  })

  describe('custom', () => {
    describe('authorize', () => {
      describe('custom_parameters', () => {
        var config = {}
        for (var key in oauth) {
          var provider = oauth[key]
          if (provider.oauth === 2 && provider.custom_parameters) {
            config[key] = {}
            provider.custom_parameters.forEach((param, index) => {
              config[key][param] = index.toString()
            })
          }
        }
        var grant = new Grant(config)
        delete config.server

        Object.keys(config).forEach((key) => {
          it(key, () => {
            var url = oauth2.authorize(grant.config[key])
            var query = qs.parse(url.split('?')[1])
            delete query.response_type
            delete query.redirect_uri
            ;(key === 'optimizely')
              ? t.deepEqual(query, {})
              : t.deepEqual(query, config[key])
          })
        })
      })

      describe('subdomain', () => {
        var config = {}
        for (var key in oauth) {
          var provider = oauth[key]
          if (provider.oauth === 2 && provider.subdomain) {
            config[key] = {subdomain: 'grant'}
          }
        }
        var grant = new Grant(config)
        delete config.server

        Object.keys(config).forEach((key) => {
          it(key, () => {
            var url = oauth2.authorize(grant.config[key])
            if (key !== 'vend') {
              t.ok(/grant/.test(url))
            }
          })
        })
      })

      describe('web_server', () => {
        var config = {basecamp: {}}
        var grant = new Grant(config)
        it('basecamp', () => {
          var url = oauth2.authorize(grant.config.basecamp)
          var query = qs.parse(url.split('?')[1])
          t.equal(query.type, 'web_server')
        })
      })

      describe('scopes', () => {
        var config = {optimizely: {scope: ['all']}}
        var grant = new Grant(config)
        it('optimizely', () => {
          var url = oauth2.authorize(grant.config.optimizely)
          var query = qs.parse(url.split('?')[1])
          t.equal(query.scopes, 'all')
        })
      })

      describe('response_type', () => {
        var config = {visualstudio: {response_type: 'Assertion'}}
        var grant = new Grant(config)
        it('visualstudio', () => {
          var url = oauth2.authorize(grant.config.visualstudio)
          var query = qs.parse(url.split('?')[1])
          t.equal(query.response_type, 'Assertion')
        })
      })

      describe('scopes separated by unencoded + sign', () => {
        var config = {unsplash: {scope: ['public', 'read_photos']}}
        var grant = new Grant(config)
        it('unsplash', () => {
          var url = oauth2.authorize(grant.config.unsplash)
          t.equal(url.replace(/.*scope=(.*)/g, '$1'), 'public+read_photos')
        })
      })
    })

    describe('access', () => {
      var grant, server

      before((done) => {
        var config = {
          server: {protocol: 'http', host: 'localhost:5000', callback: '/'},
          basecamp: {}, concur: {}, ebay: {}, fitbit2: {}, homeaway: {},
          reddit: {}, shopify: {}, smartsheet: {}, surveymonkey: {}, visualstudio: {}
        }
        grant = new Grant(config)
        var app = express().use(grant).use(bodyParser.urlencoded({extended: true}))

        grant.config.basecamp.access_url = url('/access_url')
        grant.config.concur.access_url = url('/access_url')
        grant.config.ebay.access_url = url('/access_url')
        grant.config.fitbit2.access_url = url('/access_url')
        grant.config.homeaway.access_url = url('/access_url')
        grant.config.reddit.access_url = url('/access_url')
        grant.config.smartsheet.access_url = url('/access_url')
        grant.config.surveymonkey.access_url = url('/access_url')
        grant.config.visualstudio.access_url = url('/access_url')

        app.post('/access_url', (req, res) => {
          if (req.headers.authorization) {
            res.end(req.headers.authorization)
          }
          else if (req.url.split('?')[1]) {
            res.end(qs.stringify(req.query))
          }
          else if (req.body) {
            res.end(qs.stringify(req.body))
          }
        })
        server = app.listen(5000, done)
      })

      describe('web_server', () => {
        it('basecamp', (done) => {
          oauth2.access(grant.config.basecamp, {code: 'code'}, {}, (err, body) => {
            var query = qs.parse(body)
            t.equal(query.type, 'web_server')
            done()
          })
        })
      })

      describe('qs', () => {
        it('concur', (done) => {
          grant.config.concur.key = 'key'
          grant.config.concur.secret = 'secret'
          oauth2.access(grant.config.concur, {code: 'code'}, {}, (err, body) => {
            t.deepEqual(qs.parse(body), {
              code: 'code', client_id: 'key', client_secret: 'secret'
            })
            done()
          })
        })
      })

      describe('basic auth', () => {
        it('ebay', (done) => {
          grant.config.ebay.key = 'key'
          grant.config.ebay.secret = 'secret'
          oauth2.access(grant.config.ebay, {code: 'code'}, {}, (err, body) => {
            t.deepEqual(
              Buffer(body.replace('Basic ', ''), 'base64').toString().split(':'),
              ['key', 'secret']
            )
            done()
          })
        })
        it('fitbit2', (done) => {
          grant.config.fitbit2.key = 'key'
          grant.config.fitbit2.secret = 'secret'
          oauth2.access(grant.config.fitbit2, {code: 'code'}, {}, (err, body) => {
            t.deepEqual(
              Buffer(body.replace('Basic ', ''), 'base64').toString().split(':'),
              ['key', 'secret']
            )
            done()
          })
        })
        it('homeaway', (done) => {
          grant.config.homeaway.key = 'key'
          grant.config.homeaway.secret = 'secret'
          oauth2.access(grant.config.homeaway, {code: 'code'}, {}, (err, body) => {
            t.deepEqual(
              Buffer(body.replace('Basic ', ''), 'base64').toString().split(':'),
              ['key', 'secret']
            )
            done()
          })
        })
        it('reddit', (done) => {
          grant.config.reddit.key = 'key'
          grant.config.reddit.secret = 'secret'
          oauth2.access(grant.config.reddit, {code: 'code'}, {}, (err, body) => {
            t.deepEqual(
              Buffer(body.replace('Basic ', ''), 'base64').toString().split(':'),
              ['key', 'secret']
            )
            done()
          })
        })
      })

      describe('hash', () => {
        it('smartsheet', (done) => {
          oauth2.access(grant.config.smartsheet, {code: 'code'}, {}, (err, body) => {
            var query = qs.parse(body)
            t.ok(typeof query.hash === 'string')
            done()
          })
        })
      })

      describe('api_key', () => {
        it('surveymonkey', (done) => {
          grant.config.surveymonkey.custom_params = {api_key: 'api_key'}
          oauth2.access(grant.config.surveymonkey, {code: 'code'}, {}, (err, body) => {
            t.deepEqual(qs.parse(body), {api_key: 'api_key'})
            done()
          })
        })
      })

      describe('Assertion Framework for OAuth 2.0', () => {
        it('visualstudio', (done) => {
          grant.config.visualstudio.secret = 'secret'
          oauth2.access(grant.config.visualstudio, {code: 'code'}, {}, (err, body) => {
            t.deepEqual(qs.parse(body), {
              client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
              client_assertion: 'secret',
              grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
              assertion: 'code',
              redirect_uri: url('/connect/visualstudio/callback')
            })
            done()
          })
        })
      })

      describe('subdomain', () => {
        it('shopify', (done) => {
          grant.config.shopify.access_url = url('/[subdomain]')
          grant.config.shopify.subdomain = 'access_url'
          oauth2.access(grant.config.shopify, {code: 'code'}, {}, (err, body) => {
            t.deepEqual(qs.parse(body), {
              grant_type: 'authorization_code',
              code: 'code',
              redirect_uri: url('/connect/shopify/callback')
            })
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
