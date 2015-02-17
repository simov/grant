
var express = require('express')
  , request = require('request')
  , should = require('should')
  , qs = require('qs')
var Grant = require('../../../').express()


describe('flow - express', function () {
  function url (path) {
    var c = _config.server
    return c.protocol + '://' + c.host + path
  }

  var _config = {server: {protocol:'http', host:'localhost:5000', callback:'/'}}
  var server

  describe('oauth1', function () {
    before(function (done) {
      var grant = new Grant(_config)
      var app = express().use(grant)

      grant.config.twitter.request_url = url('/request_url')
      grant.config.twitter.authorize_url = url('/authorize_url')
      grant.config.twitter.access_url = url('/access_url')

      app.post('/request_url', function (req, res) {
        res.end(qs.stringify({oauth_token:'token', oauth_token_secret:'secret'}))
      })
      app.get('/authorize_url', function (req, res) {
        res.redirect(url('/connect/twitter/callback?'+qs.stringify({
          oauth_token:'token', oauth_verifier:'verifier'
        })))
      })
      app.post('/access_url', function (req, res) {
        res.end(JSON.stringify({
          oauth_token:'token', oauth_token_secret:'secret'
        }))
      })
      app.get('/', function (req, res) {
        res.end(JSON.stringify(req.query))
      })
      server = app.listen(5000, done)
    })

    it('twitter', function (done) {
      request.get(url('/connect/twitter'), {
        jar:request.jar(),
        json:true
      }, function (err, res, body) {
        should.deepEqual(body, {
          access_token:'token', access_secret:'secret',
          raw: {oauth_token:'token', oauth_token_secret:'secret'}
        })
        done()
      })
    })

    after(function (done) {
      server.close(done)
    })
  })

  describe('oauth2', function () {
    before(function (done) {
      var grant = new Grant(_config)
      var app = express().use(grant)

      grant.config.facebook.authorize_url = url('/authorize_url')
      grant.config.facebook.access_url = url('/access_url')

      app.get('/authorize_url', function (req, res) {
        res.redirect(url('/connect/facebook/callback?code=code'))
      })
      app.post('/access_url', function (req, res) {
        res.end(JSON.stringify({
          access_token:'token', refresh_token:'refresh', expires_in:3600
        }))
      })
      app.get('/', function (req, res) {
        res.end(JSON.stringify(req.query))
      })
      server = app.listen(5000, done)
    })

    it('facebook', function (done) {
      request.get(url('/connect/facebook'), {
        jar:request.jar(),
        json:true
      }, function (err, res, body) {
        should.deepEqual(body, {
          access_token:'token', refresh_token:'refresh',
          raw: {access_token:'token', refresh_token:'refresh', expires_in:3600}
        })
        done()
      })
    })

    after(function (done) {
      server.close(done)
    })
  })

  describe('custom', function () {
    before(function (done) {
      var grant = new Grant(_config)
      var app = express().use(grant)

      grant.config.getpocket.request_url = url('/request_url')
      grant.config.getpocket.authorize_url = url('/authorize_url')
      grant.config.getpocket.access_url = url('/access_url')

      app.post('/request_url', function (req, res) {
        res.end(qs.stringify({code:'code'}))
      })
      app.get('/authorize_url', function (req, res) {
        res.redirect(url('/connect/getpocket/callback?'+qs.stringify({
          request_token:'token'
        })))
      })
      app.post('/access_url', function (req, res) {
        res.end(JSON.stringify({
          access_token:'token', username:'grant'
        }))
      })
      app.get('/', function (req, res) {
        res.end(JSON.stringify(req.query))
      })
      server = app.listen(5000, done)
    })

    it('getpocket', function (done) {
      request.get(url('/connect/getpocket'), {
        jar:request.jar(),
        json:true
      }, function (err, res, body) {
        should.deepEqual(body, {
          access_token:'token',
          raw: {access_token:'token', username:'grant'}
        })
        done()
      })
    })

    after(function (done) {
      server.close(done)
    })
  })
})
