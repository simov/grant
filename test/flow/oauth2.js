'use strict'

var express = require('express')
  , bodyParser = require('body-parser')
  , should = require('should')
  , qs = require('qs')
var Grant = require('../../').express()
  , oauth2 = require('../../lib/flow/oauth2')


describe('oauth2', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var grant, app, server
  var config = {server: {protocol:'http', host:'localhost:5000', callback:'/'}}

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
        err.should.equal('error%5Berror%5D=invalid')
        should.deepEqual(qs.parse(err), {error: {error:'invalid'}})
        done()
      })
    })
    it('step1 - missing code - empty response', function (done) {
      oauth2.step2(grant.config.facebook, {}, {}, function (err, body) {
        err.should.equal('error%5Berror%5D=Grant%3A%20authorize_url')
        should.deepEqual(qs.parse(err), {error: {error:'Grant: authorize_url'}})
        done()
      })
    })

    it('step1 - state mismatch', function (done) {
      oauth2.step2(grant.config.facebook, {code:'code',state:'Purest'}, {state:'Grant'}, function (err, body) {
        err.should.equal('error%5Berror%5D=Grant%3A%20OAuth2%20state%20mismatch')
        should.deepEqual(qs.parse(err), {error: {error:'Grant: OAuth2 state mismatch'}})
        done()
      })
    })

    it('step2 - network error', function (done) {
      oauth2.step2(grant.config.facebook, {code:'code'}, {}, function (err, body) {
        err.should.equal('error%5BCannot%20POST%20%2Faccess_err%0A%5D=')
        should.deepEqual(qs.parse(err), {error: {'Cannot POST /access_err\n': ''}})
        done()
      })
    })

    it('step2 - error response', function (done) {
      grant.config.facebook.access_url = url('/access_url')
      oauth2.step2(grant.config.facebook, {code:'code'}, {}, function (err, body) {
        err.should.equal('error%5Berror%5D=invalid')
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
      before(function () {
        grant = new Grant(config)
      })

      describe('web_server', function () {
        it('basecamp', function () {
          var url = oauth2.step1(grant.config.basecamp)
          var query = qs.parse(url.split('?')[1])
          query.type.should.equal('web_server')
        })
      })

      describe('custom_parameters', function () {
        it('coinbase', function () {
          grant.config.coinbase.meta = {
            send_limit_amount:'5', send_limit_currency:'USD', send_limit_period:'day'
          }
          var url = oauth2.step1(grant.config.coinbase)
          var query = qs.parse(url.split('?')[1])
          should.deepEqual(query.meta, {
            send_limit_amount:'5', send_limit_currency:'USD', send_limit_period:'day'
          })
        })

        it('google', function () {
          grant.config.google.access_type = 'offline'
          var url = oauth2.step1(grant.config.google)
          var query = qs.parse(url.split('?')[1])
          query.access_type.should.equal('offline')
        })

        it('reddit', function () {
          grant.config.reddit.duration = 'permanent'
          var url = oauth2.step1(grant.config.reddit)
          var query = qs.parse(url.split('?')[1])
          query.duration.should.equal('permanent')
        })

        it('spotify', function () {
          grant.config.spotify.show_dialog = 'true'
          var url = oauth2.step1(grant.config.spotify)
          var query = qs.parse(url.split('?')[1])
          query.show_dialog.should.equal('true')
        })

        it('wordpress', function () {
          grant.config.wordpress.blog = 'Grant'
          var url = oauth2.step1(grant.config.wordpress)
          var query = qs.parse(url.split('?')[1])
          query.blog.should.equal('Grant')
        })
      })

      describe('subdomain', function () {
        it('shopify', function () {
          grant.config.shopify.subdomain = 'grant'
          var url = oauth2.step1(grant.config.shopify)
          url.indexOf('https://grant.myshopify.com').should.equal(0)
        })

        it('zendesk', function () {
          grant.config.zendesk.subdomain = 'grant'
          var url = oauth2.step1(grant.config.zendesk)
          url.indexOf('https://grant.zendesk.com').should.equal(0)
        })
      })
    })

    describe('step2', function () {
      before(function (done) {
        grant = new Grant(config)
        app = express().use(grant).use(bodyParser.urlencoded({extended:true}))

        grant.config.basecamp.access_url = url('/access_url')
        grant.config.assembla.access_url = url('/access_url')
        grant.config.reddit.access_url = url('/access_url')

        app.post('/access_url', function (req, res) {
          return (req.headers.authorization)
            ? res.end(JSON.stringify({basic:true}))
            : res.end(JSON.stringify(req.body))
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

      describe('basic auth', function () {
        it('assembla', function (done) {
          grant.config.assembla.key = 'key'
          grant.config.assembla.secret = 'secret'
          oauth2.step2(grant.config.assembla, {code:'code'}, {}, function (err, body) {
            var query = JSON.parse(body)
            query.basic.should.equal(true)
            done()
          })
        })

        it('reddit', function (done) {
          grant.config.reddit.key = 'key'
          grant.config.reddit.secret = 'secret'
          oauth2.step2(grant.config.reddit, {code:'code'}, {}, function (err, body) {
            var query = JSON.parse(body)
            query.basic.should.equal(true)
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

        it('zendesk', function (done) {
          grant.config.zendesk.access_url = url('/[subdomain]')
          grant.config.zendesk.subdomain = 'access_url'
          oauth2.step2(grant.config.zendesk, {code:'code'}, {}, function (err, body) {
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
