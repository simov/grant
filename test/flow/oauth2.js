'use strict'

var express = require('express')
  , bodyParser = require('body-parser')
  , should = require('should')
  , qs = require('qs')
var Grant = require('../../').express()
  , oauth2 = require('../../lib/flow/oauth2')
  , oauth = require('../../config/oauth')


describe('oauth2', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var grant, app, server
  var config = {
    server: {protocol:'http', host:'localhost:5000', callback:'/'},
    facebook:{}
  }

  describe('success', function () {
    before(function (done) {
      grant = new Grant(config)
      app = express().use(grant)

      grant.config.facebook.authorize_url = '/authorize_url'
      grant.config.facebook.access_url = url('/access_url')

      app.post('/access_url', function (req, res) {
        res.end(JSON.stringify({some:'data'}))
      })
      server = app.listen(5000, done)
    })

    it('step1', function () {
      var url = oauth2.step1(grant.config.facebook)
      url.should.equal('/authorize_url?response_type=code'+
        '&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fconnect%2Ffacebook%2Fcallback')
    })

    it('step2', function (done) {
      oauth2.step2(grant.config.facebook, {code:'code'}, {}, function (err, body) {
        should.deepEqual(JSON.parse(body), {some:'data'})
        done()
      })
    })

    it('step3', function () {
      var url = oauth2.step3(grant.config.facebook, {some:'data'})
      url.should.equal('raw%5Bsome%5D=data')
    })

    after(function (done) {
      server.close(done)
    })
  })

  describe('error', function () {
    before(function (done) {
      grant = new Grant(config)
      app = express().use(grant)

      grant.config.facebook.authorize_url = '/authorize_url'
      grant.config.facebook.access_url = url('/access_err')

      app.post('/access_url', function (req, res) {
        res.status(500).end(JSON.stringify({error:'invalid'}))
      })
      server = app.listen(5000, done)
    })

    it('step1 - missing code - error response', function (done) {
      oauth2.step2(grant.config.facebook, {error:'invalid'}, {}, function (err, body) {
        should.deepEqual(qs.parse(err), {error: {error:'invalid'}})
        done()
      })
    })
    it('step1 - missing code - empty response', function (done) {
      oauth2.step2(grant.config.facebook, {}, {}, function (err, body) {
        should.deepEqual(qs.parse(err),
          {error: {error:'Grant: OAuth2 missing code parameter'}})
        done()
      })
    })

    it('step1 - state mismatch', function (done) {
      oauth2.step2(grant.config.facebook, {code:'code',state:'Purest'}, {state:'Grant'}, function (err, body) {
        should.deepEqual(qs.parse(err), {error: {error:'Grant: OAuth2 state mismatch'}})
        done()
      })
    })

    it('step2 - network error', function (done) {
      oauth2.step2(grant.config.facebook, {code:'code'}, {}, function (err, body) {
        should.deepEqual(qs.parse(err), {error: {'Cannot POST /access_err\n': ''}})
        done()
      })
    })

    it('step2 - error response', function (done) {
      grant.config.facebook.access_url = url('/access_url')
      oauth2.step2(grant.config.facebook, {code:'code'}, {}, function (err, body) {
        should.deepEqual(qs.parse(err), {error: {error:'invalid'}})
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
          if (provider.oauth == 2 && provider.custom_parameters) {
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
            if (key != 'optimizely') {
              should.deepEqual(query, config[key])
            }
            else {
              should.deepEqual(query, {})
            }
          })
        })
      })

      describe('subdomain', function () {
        var config = {}
        for (var key in oauth) {
          var provider = oauth[key]
          if (provider.oauth == 2 && provider.subdomain) {
            config[key] = {subdomain:'grant'}
          }
        }
        var grant = new Grant(config)
        delete config.server

        Object.keys(config).forEach(function (key) {
          it(key, function () {
            var url = oauth2.step1(grant.config[key])
            if (key != 'vend') {
              url.should.match(/grant/)
            }
          })
        })
      })

      describe('web_server', function () {
        var config = {basecamp:{}}
        var grant = new Grant(config)
        it('basecamp', function () {
          var url = oauth2.step1(grant.config.basecamp)
          var query = qs.parse(url.split('?')[1])
          query.type.should.equal('web_server')
        })
      })

      describe('scopes', function () {
        var config = {optimizely:{scope:['all']}}
        var grant = new Grant(config)
        it('optimizely', function () {
          var url = oauth2.step1(grant.config.optimizely)
          var query = qs.parse(url.split('?')[1])
          query.scopes.should.equal('all')
        })
      })
    })

    describe('step2', function () {
      before(function (done) {
        var config = {
          server: {protocol:'http', host:'localhost:5000', callback:'/'},
          basecamp:{}, concur:{}, fitbit2:{}, reddit:{},
          smartsheet:{}, surveymonkey:{}, shopify:{}
        }
        grant = new Grant(config)
        app = express().use(grant).use(bodyParser.urlencoded({extended:true}))

        grant.config.basecamp.access_url = url('/access_url')
        grant.config.concur.access_url = url('/access_url')
        grant.config.reddit.access_url = url('/access_url')
        grant.config.smartsheet.access_url = url('/access_url')
        grant.config.surveymonkey.access_url = url('/access_url')
        grant.config.fitbit2.access_url = url('/access_url')

        app.post('/access_url', function (req, res) {
          if (req.headers.authorization) {
            res.end(JSON.stringify({basic: true}))
          }
          else if (req.url.split('?')[1]) {
            res.end(JSON.stringify(qs.parse(req.url.split('?')[1])))
          }
          else {
            res.end(JSON.stringify(req.body))
          }
        })
        server = app.listen(5000, done)
      })

      describe('web_server', function () {
        it('basecamp', function (done) {
          oauth2.step2(grant.config.basecamp, {code:'code'}, {}, function (err, body) {
            var query = JSON.parse(body)
            query.type.should.equal('web_server')
            done()
          })
        })
      })

      describe('qs', function () {
        it('concur', function (done) {
          grant.config.concur.key = 'key'
          grant.config.concur.secret = 'secret'
          oauth2.step2(grant.config.concur, {code:'code'}, {}, function (err, body) {
            var query = JSON.parse(body)
            query.should.deepEqual({
              code:'code', client_id:'key', client_secret:'secret'
            })
            done()
          })
        })
      })

      describe('basic auth', function () {
        it('reddit', function (done) {
          grant.config.reddit.key = 'key'
          grant.config.reddit.secret = 'secret'
          oauth2.step2(grant.config.reddit, {code:'code'}, {}, function (err, body) {
            var query = JSON.parse(body)
            query.basic.should.equal(true)
            done()
          })
        })
        it('fitbit2', function (done) {
          grant.config.fitbit2.key = 'key'
          grant.config.fitbit2.secret = 'secret'
          oauth2.step2(grant.config.fitbit2, {code:'code'}, {}, function (err, body) {
            var query = JSON.parse(body)
            query.basic.should.equal(true)
            done()
          })
        })
      })

      describe('hash', function () {
        it('smartsheet', function (done) {
          oauth2.step2(grant.config.smartsheet, {code:'code'}, {}, function (err, body) {
            var query = JSON.parse(body)
            query.hash.should.be.type('string')
            done()
          })
        })
      })

      describe('api_key', function () {
        it('surveymonkey', function (done) {
          grant.config.surveymonkey.custom_params = {api_key:'api_key'}
          oauth2.step2(grant.config.surveymonkey, {code:'code'}, {}, function (err, body) {
            var query = JSON.parse(body)
            query.api_key.should.equal('api_key')
            done()
          })
        })
      })

      describe('subdomain', function () {
        it('shopify', function (done) {
          grant.config.shopify.access_url = url('/[subdomain]')
          grant.config.shopify.subdomain = 'access_url'
          oauth2.step2(grant.config.shopify, {code:'code'}, {}, function (err, body) {
            var query = JSON.parse(body)
            query.code.should.equal('code')
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
