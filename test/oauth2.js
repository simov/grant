
var express = require('express'),
  request = require('request'),
  should = require('should'),
  qs = require('qs')
var Grant = require('../').express(),
  oauth2 = require('../lib/oauth2')


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
      url.should.equal('/?raw%5Bsome%5D=data')
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

    it('step1 - missing code', function (done) {
      oauth2.step2(grant.config.facebook, {error:'invalid'}, {}, function (err, body) {
        err.should.equal('error%5Berror%5D=invalid')
        should.deepEqual(qs.parse(err), {error: {error:'invalid'}})
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
})
