'use strict'

var t = require('assert')
var qs = require('qs')
var request = require('request')
var Hapi = require('hapi')
var yar = require('yar')
var Grant = require('../../../').hapi()


describe('flow - hapi', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var config = {
    server: {protocol: 'http', host: 'localhost:5000', callback: '/'},
    facebook: {}, getpocket: {}, twitter: {}
  }
  var server, grant

  describe('oauth1', function () {
    before(function (done) {
      grant = new Grant()

      server = new Hapi.Server()
      server.connection({host: 'localhost', port: 5000})

      server.route({method: 'POST', path: '/request_url', handler: function (req, res) {
        res(qs.stringify({oauth_token: 'token', oauth_token_secret: 'secret'}))
      }})
      server.route({method: 'GET', path: '/authorize_url', handler: function (req, res) {
        res.redirect(url('/connect/twitter/callback?' + qs.stringify({
          oauth_token: 'token', oauth_verifier: 'verifier'
        })))
      }})
      server.route({method: 'POST', path: '/access_url', handler: function (req, res) {
        res(JSON.stringify({
          oauth_token: 'token', oauth_token_secret: 'secret'
        }))
      }})
      server.route({method: 'GET', path: '/', handler: function (req, res) {
        res(JSON.stringify((req.session || req.yar).get('grant').response || req.query))
      }})

      server.register([
        {register: grant, options: config},
        {register: yar, options: {cookieOptions: {
          password: '01234567890123456789012345678912', isSecure: false}}}
      ], function (err) {
        if (err) {
          done(err)
          return
        }

        grant.register.config.twitter.request_url = url('/request_url')
        grant.register.config.twitter.authorize_url = url('/authorize_url')
        grant.register.config.twitter.access_url = url('/access_url')

        server.start(done)
      })
    })

    it('twitter', function (done) {
      function assert (done) {
        request.get(url('/connect/twitter'), {
          jar: request.jar(),
          json: true
        }, function (err, res, body) {
          t.deepEqual(body, {
            access_token: 'token', access_secret: 'secret',
            raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
          })
          done()
        })
      }
      grant.register.config.twitter.transport = 'querystring'
      assert(function () {
        grant.register.config.twitter.transport = 'session'
        assert(done)
      })
    })

    after(function (done) {
      server.stop(done)
    })
  })

  describe('oauth2', function () {
    before(function (done) {
      var grant = new Grant()

      server = new Hapi.Server()
      server.connection({host: 'localhost', port: 5000})

      server.route({method: 'GET', path: '/authorize_url', handler: function (req, res) {
        res.redirect(url('/connect/facebook/callback?code=code'))
      }})
      server.route({method: 'POST', path: '/access_url', handler: function (req, res) {
        res(JSON.stringify({
          access_token: 'token', refresh_token: 'refresh', expires_in: 3600
        }))
      }})
      server.route({method: 'GET', path: '/', handler: function (req, res) {
        res(JSON.stringify(req.query))
      }})

      server.register([
        {register: grant, options: config},
        {register: yar, options: {cookieOptions: {password: '01234567890123456789012345678912', isSecure: false}}}
      ], function (err) {
        if (err) {
          done(err)
          return
        }

        grant.register.config.facebook.authorize_url = url('/authorize_url')
        grant.register.config.facebook.access_url = url('/access_url')

        server.start(done)
      })
    })

    it('facebook', function (done) {
      request.get(url('/connect/facebook'), {
        jar: request.jar(),
        json: true
      }, function (err, res, body) {
        t.deepEqual(body, {
          access_token: 'token', refresh_token: 'refresh',
          raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
        })
        done()
      })
    })

    after(function (done) {
      server.stop(done)
    })
  })

  describe('custom', function () {
    before(function (done) {
      var grant = new Grant()

      server = new Hapi.Server()
      server.connection({host: 'localhost', port: 5000})

      server.route({method: 'POST', path: '/request_url', handler: function (req, res) {
        res(qs.stringify({code: 'code'}))
      }})
      server.route({method: 'GET', path: '/authorize_url', handler: function (req, res) {
        res.redirect(url('/connect/getpocket/callback?' + qs.stringify({
          request_token: 'token'
        })))
      }})
      server.route({method: 'POST', path: '/access_url', handler: function (req, res) {
        res(JSON.stringify({
          access_token: 'token', username: 'grant'
        }))
      }})
      server.route({method: 'GET', path: '/', handler: function (req, res) {
        res(JSON.stringify(req.query))
      }})

      server.register([
        {register: grant, options: config},
        {register: yar, options: {cookieOptions: {password: '01234567890123456789012345678912', isSecure: false}}}
      ], function (err) {
        if (err) {
          done(err)
          return
        }

        grant.register.config.getpocket.request_url = url('/request_url')
        grant.register.config.getpocket.authorize_url = url('/authorize_url')
        grant.register.config.getpocket.access_url = url('/access_url')

        server.start(done)
      })
    })

    it('getpocket', function (done) {
      request.get(url('/connect/getpocket'), {
        jar: request.jar(),
        json: true
      }, function (err, res, body) {
        t.deepEqual(body, {
          access_token: 'token',
          raw: {access_token: 'token', username: 'grant'}
        })
        done()
      })
    })

    after(function (done) {
      server.stop(done)
    })
  })
})
