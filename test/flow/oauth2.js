'use strict'

var t = require('assert')
var http = require('http')
var qs = require('qs')
var express = require('express')
var bodyParser = require('body-parser')
var Grant = require('../../').express()
var oauth2 = require('../../lib/flow/oauth2')
var oauth = require('../../config/oauth')


describe('oauth2', function () {
  function url (path) {
    return 'http://localhost:5000' + path
  }

  describe('success', function () {
    var server

    before(function (done) {
      server = http.createServer()
      server.on('request', function (req, res) {
        req.pipe(res)
      })
      server.listen(5000, done)
    })

    it('step1', function () {
      var provider = {
        authorize_url: '/authorize_url',
        redirect_uri: '/redirect_uri',
        key: 'key',
        scope: 'read,write',
        state: '123'
      }
      var url = oauth2.step1(provider)
      t.deepEqual(qs.parse(url.replace('/authorize_url?', '')), {
        client_id: 'key',
        response_type: 'code',
        redirect_uri: '/redirect_uri',
        scope: 'read,write',
        state: '123'
      })
    })

    it('step2', function (done) {
      var provider = {
        access_url: url('/access_url'),
        redirect_uri: '/redirect_uri',
        key: 'key',
        secret: 'secret'
      }
      var step1 = {
        code: 'code'
      }
      oauth2.step2(provider, step1, {}, function (err, body) {
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

    it('step3', function () {
      var provider = {
        access_url: '/access_url',
        oauth: 2
      }
      var step2 = {
        access_token: 'token',
        refresh_token: 'refresh',
        some: 'data'
      }
      var url = oauth2.step3(provider, step2)
      t.deepEqual(qs.parse(url), {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', some: 'data'}
      })
    })

    after(function (done) {
      server.close(done)
    })
  })

  describe('error', function () {
    var server

    before(function (done) {
      server = http.createServer()
      server.on('request', function (req, res) {
        res.writeHead(500)
        res.end(qs.stringify({error: 'invalid'}))
      })
      server.listen(5000, done)
    })

    it('step2 - missing code - response error', function (done) {
      var provider = {}
      var step1 = {error: 'invalid'}
      oauth2.step2(provider, step1, {}, function (err, body) {
        t.deepEqual(qs.parse(err), {error: {error: 'invalid'}})
        done()
      })
    })
    it('step2 - missing code - empty response', function (done) {
      var provider = {}
      var step1 = {}
      oauth2.step2(provider, step1, {}, function (err, body) {
        t.deepEqual(qs.parse(err),
          {error: {error: 'Grant: OAuth2 missing code parameter'}})
        done()
      })
    })
    it('step2 - state mismatch', function (done) {
      var provider = {}
      var step1 = {code: 'code', state: 'Purest'}
      var session = {state: 'Grant'}
      oauth2.step2(provider, step1, session, function (err, body) {
        t.deepEqual(qs.parse(err), {error: {error: 'Grant: OAuth2 state mismatch'}})
        done()
      })
    })
    it('step2 - request error', function (done) {
      var provider = {access_url: '/access_url'}
      var step1 = {code: 'code'}
      oauth2.step2(provider, step1, {}, function (err, body) {
        t.deepEqual(qs.parse(err), {error: {error: 'socket hang up'}})
        done()
      })
    })
    it('step2 - response error', function (done) {
      var provider = {access_url: url('/access_url')}
      var step1 = {code: 'code'}
      oauth2.step2(provider, step1, {}, function (err, body) {
        t.deepEqual(qs.parse(err), {error: {error: 'invalid'}})
        done()
      })
    })

    after(function (done) {
      server.close(done)
    })
  })

  describe('custom', function () {
    describe('step1', function () {
      describe('custom_parameters', function () {
        var config = {}
        for (var key in oauth) {
          var provider = oauth[key]
          if (provider.oauth === 2 && provider.custom_parameters) {
            config[key] = {}
            provider.custom_parameters.forEach(function (param, index) {
              config[key][param] = index.toString()
            })
          }
        }
        var grant = new Grant(config)
        delete config.server

        Object.keys(config).forEach(function (key) {
          it(key, function () {
            var url = oauth2.step1(grant.config[key])
            var query = qs.parse(url.split('?')[1])
            delete query.response_type
            delete query.redirect_uri
            ;(key === 'optimizely')
              ? t.deepEqual(query, {})
              : t.deepEqual(query, config[key])
          })
        })
      })

      describe('subdomain', function () {
        var config = {}
        for (var key in oauth) {
          var provider = oauth[key]
          if (provider.oauth === 2 && provider.subdomain) {
            config[key] = {subdomain: 'grant'}
          }
        }
        var grant = new Grant(config)
        delete config.server

        Object.keys(config).forEach(function (key) {
          it(key, function () {
            var url = oauth2.step1(grant.config[key])
            if (key !== 'vend') {
              t.ok(/grant/.test(url))
            }
          })
        })
      })

      describe('web_server', function () {
        var config = {basecamp: {}}
        var grant = new Grant(config)
        it('basecamp', function () {
          var url = oauth2.step1(grant.config.basecamp)
          var query = qs.parse(url.split('?')[1])
          t.equal(query.type, 'web_server')
        })
      })

      describe('scopes', function () {
        var config = {optimizely: {scope: ['all']}}
        var grant = new Grant(config)
        it('optimizely', function () {
          var url = oauth2.step1(grant.config.optimizely)
          var query = qs.parse(url.split('?')[1])
          t.equal(query.scopes, 'all')
        })
      })

      describe('response_type', function () {
        var config = {visualstudio: {response_type: 'Assertion'}}
        var grant = new Grant(config)
        it('visualstudio', function () {
          var url = oauth2.step1(grant.config.visualstudio)
          var query = qs.parse(url.split('?')[1])
          t.equal(query.response_type, 'Assertion')
        })
      })

      describe('scopes separated by unencoded + sign', () => {
        var config = {unsplash: {scope: ['public', 'read_photos']}}
        var grant = new Grant(config)
        it('unsplash', () => {
          var url = oauth2.step1(grant.config.unsplash)
          t.equal(url.replace(/.*scope=(.*)/g, '$1'), 'public+read_photos')
        })
      })
    })

    describe('step2', function () {
      var grant, server

      before(function (done) {
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

        app.post('/access_url', function (req, res) {
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

      describe('web_server', function () {
        it('basecamp', function (done) {
          oauth2.step2(grant.config.basecamp, {code: 'code'}, {}, function (err, body) {
            var query = qs.parse(body)
            t.equal(query.type, 'web_server')
            done()
          })
        })
      })

      describe('qs', function () {
        it('concur', function (done) {
          grant.config.concur.key = 'key'
          grant.config.concur.secret = 'secret'
          oauth2.step2(grant.config.concur, {code: 'code'}, {}, function (err, body) {
            t.deepEqual(qs.parse(body), {
              code: 'code', client_id: 'key', client_secret: 'secret'
            })
            done()
          })
        })
      })

      describe('basic auth', function () {
        it('ebay', function (done) {
          grant.config.ebay.key = 'key'
          grant.config.ebay.secret = 'secret'
          oauth2.step2(grant.config.ebay, {code: 'code'}, {}, function (err, body) {
            t.deepEqual(
              Buffer(body.replace('Basic ', ''), 'base64').toString().split(':'),
              ['key', 'secret']
            )
            done()
          })
        })
        it('fitbit2', function (done) {
          grant.config.fitbit2.key = 'key'
          grant.config.fitbit2.secret = 'secret'
          oauth2.step2(grant.config.fitbit2, {code: 'code'}, {}, function (err, body) {
            t.deepEqual(
              Buffer(body.replace('Basic ', ''), 'base64').toString().split(':'),
              ['key', 'secret']
            )
            done()
          })
        })
        it('homeaway', function (done) {
          grant.config.homeaway.key = 'key'
          grant.config.homeaway.secret = 'secret'
          oauth2.step2(grant.config.homeaway, {code: 'code'}, {}, function (err, body) {
            t.deepEqual(
              Buffer(body.replace('Basic ', ''), 'base64').toString().split(':'),
              ['key', 'secret']
            )
            done()
          })
        })
        it('reddit', function (done) {
          grant.config.reddit.key = 'key'
          grant.config.reddit.secret = 'secret'
          oauth2.step2(grant.config.reddit, {code: 'code'}, {}, function (err, body) {
            t.deepEqual(
              Buffer(body.replace('Basic ', ''), 'base64').toString().split(':'),
              ['key', 'secret']
            )
            done()
          })
        })
      })

      describe('hash', function () {
        it('smartsheet', function (done) {
          oauth2.step2(grant.config.smartsheet, {code: 'code'}, {}, function (err, body) {
            var query = qs.parse(body)
            t.ok(typeof query.hash === 'string')
            done()
          })
        })
      })

      describe('api_key', function () {
        it('surveymonkey', function (done) {
          grant.config.surveymonkey.custom_params = {api_key: 'api_key'}
          oauth2.step2(grant.config.surveymonkey, {code: 'code'}, {}, function (err, body) {
            t.deepEqual(qs.parse(body), {api_key: 'api_key'})
            done()
          })
        })
      })

      describe('Assertion Framework for OAuth 2.0', function () {
        it('visualstudio', function (done) {
          grant.config.visualstudio.secret = 'secret'
          oauth2.step2(grant.config.visualstudio, {code: 'code'}, {}, function (err, body) {
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

      describe('subdomain', function () {
        it('shopify', function (done) {
          grant.config.shopify.access_url = url('/[subdomain]')
          grant.config.shopify.subdomain = 'access_url'
          oauth2.step2(grant.config.shopify, {code: 'code'}, {}, function (err, body) {
            t.deepEqual(qs.parse(body), {
              grant_type: 'authorization_code',
              code: 'code',
              redirect_uri: url('/connect/shopify/callback')
            })
            done()
          })
        })
      })

      after(function (done) {
        server.close(done)
      })
    })
  })
})
