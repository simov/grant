'use strict'

var t = require('assert')
var util = require('util')
var qs = require('qs')
var express = require('express')
var Grant = require('../../').express()
var oauth1 = require('../../lib/flow/oauth1')


describe('oauth1', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var grant, app, server
  var config = {
    server: {protocol: 'http', host: 'localhost:5000', callback: '/'},
    twitter: {}
  }

  describe('success', function () {
    before(function (done) {
      grant = new Grant(config)
      app = express().use(grant)

      grant.config.twitter.request_url = url('/request_url')
      grant.config.twitter.authorize_url = '/authorize_url'
      grant.config.twitter.access_url = url('/access_url')

      app.post('/request_url', function (req, res) {
        res.end(qs.stringify({some: 'data'}))
      })
      app.post('/access_url', function (req, res) {
        res.end(JSON.stringify({some: 'data'}))
      })
      server = app.listen(5000, done)
    })

    it('step1', function (done) {
      oauth1.step1(grant.config.twitter, function (err, data) {
        t.deepEqual(data, {some: 'data'})
        done()
      })
    })

    it('step2', function () {
      var url = oauth1.step2(grant.config.twitter, {oauth_token: 'token'})
      t.equal(url, '/authorize_url?oauth_token=token')
    })

    it('step3', function (done) {
      oauth1.step3(grant.config.twitter, {}, {oauth_token: 'token'}, function (err, url) {
        t.equal(url, 'raw%5Bsome%5D=data')
        done()
      })
    })

    after(function (done) {
      server.close(done)
    })
  })

  describe('error', function () {
    before(function (done) {
      grant = new Grant(config)
      app = express().use(grant)

      grant.config.twitter.request_url = url('/request_err')
      grant.config.twitter.authorize_url = '/authorize_url'
      grant.config.twitter.access_url = url('/access_url')

      app.post('/request_url', function (req, res) {
        res.status(500).end(JSON.stringify({error: 'invalid'}))
      })

      server = app.listen(5000, done)
    })

    it('step1 - network error', function (done) {
      oauth1.step1(grant.config.twitter, function (err, body) {
        t.deepEqual(qs.parse(err), {error: {'Cannot POST /request_err\n': ''}})
        done()
      })
    })
    it('step1 - error response', function (done) {
      grant.config.twitter.request_url = url('/request_url')
      oauth1.step1(grant.config.twitter, function (err, body) {
        t.deepEqual(qs.parse(err), {error: {error: 'invalid'}})
        done()
      })
    })

    it('step2 - mising oauth_token - error response', function () {
      var url = oauth1.step2(grant.config.twitter, {error: 'invalid'})
      t.deepEqual(qs.parse(url.replace('/?', '')),
        {error: {error: 'invalid'}})
    })
    it('step2 - mising oauth_token - empty response', function () {
      var url = oauth1.step2(grant.config.twitter, {})
      t.deepEqual(qs.parse(url.replace('/?', '')),
        {error: {error: 'Grant: OAuth1 missing oauth_token parameter'}})
    })

    it('step3 - mising oauth_token - response error', function (done) {
      oauth1.step3(grant.config.twitter, {}, {error: 'invalid'}, function (err, body) {
        t.deepEqual(qs.parse(err), {error: {error: 'invalid'}})
        done()
      })
    })
    it('step3 - mising oauth_token - empty response', function (done) {
      oauth1.step3(grant.config.twitter, {}, {}, function (err, body) {
        t.deepEqual(qs.parse(err),
          {error: {error: 'Grant: OAuth1 missing oauth_token parameter'}})
        done()
      })
    })

    after(function (done) {
      server.close(done)
    })
  })

  describe('custom', function () {
    describe('step1', function () {
      before(function (done) {
        util._extend(config, {
          copy: {}, etsy: {}, flickr: {}, freshbooks: {}, goodreads: {},
          intuit: {}, linkedin: {}, ravelry: {}, trello: {}, tripit: {}
        })
        grant = new Grant(config)
        app = express().use(grant)

        app.post('/request_url', function (req, res) {
          res.end(qs.stringify({oauth: req.headers.authorization, scope: req.query.scope}))
        })
        server = app.listen(5000, done)
      })

      describe('querystring scope', function () {
        it('copy', function (done) {
          grant.config.copy.request_url = url('/request_url')
          grant.config.copy.scope = '{"profile":{"read":true}}'
          oauth1.step1(grant.config.copy, function (err, body) {
            t.equal(body.scope, '{"profile":{"read":true}}')
            done()
          })
        })
        it('etsy', function (done) {
          grant.config.etsy.request_url = url('/request_url')
          grant.config.etsy.scope = 'email_r profile_r'
          oauth1.step1(grant.config.etsy, function (err, body) {
            t.equal(body.scope, 'email_r profile_r')
            done()
          })
        })
        it('linkedin', function (done) {
          grant.config.linkedin.request_url = url('/request_url')
          grant.config.linkedin.scope = 'scope1,scope2'
          oauth1.step1(grant.config.linkedin, function (err, body) {
            t.equal(body.scope, 'scope1,scope2')
            done()
          })
        })
      })

      describe('signature_method', function () {
        it('freshbooks', function (done) {
          grant.config.freshbooks.request_url = url('/request_url')
          oauth1.step1(grant.config.freshbooks, function (err, body) {
            t.ok(/oauth_signature_method="PLAINTEXT"/.test(body.oauth))
            done()
          })
        })
      })

      describe('subdomain', function () {
        it('freshbooks', function (done) {
          grant.config.freshbooks.request_url = url('/[subdomain]')
          grant.config.freshbooks.subdomain = 'request_url'
          oauth1.step1(grant.config.freshbooks, function (err, body) {
            t.ok(/OAuth/.test(body.oauth))
            done()
          })
        })
      })

      after(function (done) {
        server.close(done)
      })
    })

    describe('step2', function () {
      before(function () {
        grant = new Grant(config)
      })

      describe('custom_parameters', function () {
        it('trello', function () {
          grant.config.trello.custom_params = {expiration: 'never', name: 'Grant'}
          var url = oauth1.step2(grant.config.trello, {oauth_token: 'token'})
          var query = qs.parse(url.split('?')[1])
          t.deepEqual(query,
            {oauth_token: 'token', expiration: 'never', name: 'Grant'})
        })
      })

      describe('scope', function () {
        it('flickr', function () {
          grant.config.flickr.scope = ['read', 'write']
          var url = oauth1.step2(grant.config.flickr, {oauth_token: 'token'})
          var query = qs.parse(url.split('?')[1])
          t.deepEqual(query,
            {oauth_token: 'token', perms: ['read', 'write']})
        })

        it('ravelry', function () {
          grant.config.ravelry.scope = ['read', 'write']
          var url = oauth1.step2(grant.config.ravelry, {oauth_token: 'token'})
          var query = qs.parse(url.split('?')[1])
          t.deepEqual(query,
            {oauth_token: 'token', scope: ['read', 'write']})
        })

        it('trello', function () {
          grant.config.trello.custom_params = {expiration: 'never', name: 'Grant'}
          grant.config.trello.scope = ['read', 'write']
          var url = oauth1.step2(grant.config.trello, {oauth_token: 'token'})
          var query = qs.parse(url.split('?')[1])
          t.deepEqual(query,
            {oauth_token: 'token', scope: ['read', 'write'], expiration: 'never', name: 'Grant'})
        })
      })

      describe('oauth_callback', function () {
        it('tripit', function () {
          var uri = oauth1.step2(grant.config.tripit, {oauth_token: 'token'})
          var query = qs.parse(uri.split('?')[1])
          t.deepEqual(query,
            {oauth_token: 'token', oauth_callback: url('/connect/tripit/callback')})
        })
      })

      describe('subdomain', function () {
        it('freshbooks', function () {
          grant.config.freshbooks.subdomain = 'grant'
          var url = oauth1.step2(grant.config.freshbooks, {oauth_token: 'token'})
          t.equal(url.indexOf('https://grant.freshbooks.com'), 0)
        })
      })
    })

    describe('step3', function () {
      before(function (done) {
        grant = new Grant(config)
        app = express().use(grant)

        app.post('/access_url', function (req, res) {
          res.end(qs.stringify({oauth: req.headers.authorization}))
        })
        server = app.listen(5000, done)
      })

      describe('signature_method', function () {
        it('freshbooks', function (done) {
          grant.config.freshbooks.access_url = url('/access_url')
          oauth1.step3(grant.config.freshbooks, {}, {oauth_token: 'token'}, function (err, response) {
            var query = qs.parse(response)
            t.ok(/oauth_signature_method="PLAINTEXT"/.test(query.raw.oauth))
            done()
          })
        })
      })

      describe('oauth_verifier', function () {
        it('goodreads', function (done) {
          grant.config.goodreads.access_url = url('/access_url')
          oauth1.step3(grant.config.goodreads, {}, {oauth_token: 'token'}, function (err, response) {
            var query = qs.parse(response)
            t.ok(!/verifier/.test(query.raw.oauth))
            done()
          })
        })
        it('tripit', function (done) {
          grant.config.tripit.access_url = url('/access_url')
          oauth1.step3(grant.config.tripit, {}, {oauth_token: 'token'}, function (err, response) {
            var query = qs.parse(response)
            t.ok(!/verifier/.test(query.raw.oauth))
            done()
          })
        })
      })

      describe('subdomain', function () {
        it('freshbooks', function (done) {
          grant.config.freshbooks.access_url = url('/[subdomain]')
          grant.config.freshbooks.subdomain = 'access_url'
          oauth1.step3(grant.config.freshbooks, {}, {oauth_token: 'token'}, function (err, url) {
            t.ok(typeof url === 'string')
            done()
          })
        })
      })

      describe('realmId', function () {
        it('intuit', function (done) {
          grant.config.intuit.access_url = url('/access_url')
          oauth1.step3(grant.config.intuit, {}, {oauth_token: 'token', realmId: '123'}, function (err, response) {
            var query = qs.parse(response)
            t.equal(query.raw.realmId, '123')
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
