'use strict'

var request = require('request')
  , should = require('should')
  , qs = require('qs')
var express = require('express')
var Grant = require('../../../').express()


describe('session - express', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var config = {server: {protocol:'http', host:'localhost:5000'}}
  var server

  before(function (done) {
    var grant = new Grant(config)
    var app = express().use(grant)

    grant.config.facebook.authorize_url = '/authorize_url'
    grant.config.twitter.request_url = url('/request_url')
    grant.config.twitter.authorize_url = '/authorize_url'

    app.post('/request_url', function (req, res) {
      res.end(qs.stringify({oauth_token:'token'}))
    })
    app.get('/authorize_url', function (req, res) {
      res.end(JSON.stringify(req.session.grant))
    })
    server = app.listen(5000, done)
  })

  it('provider', function (done) {
    request.get(url('/connect/facebook'), {
      jar:request.jar(),
      json:true
    }, function (err, res, body) {
      should.deepEqual(body, {provider:'facebook'})
      done()
    })
  })

  it('override', function (done) {
    request.get(url('/connect/facebook/contacts'), {
      jar:request.jar(),
      json:true
    }, function (err, res, body) {
      should.deepEqual(body, {provider:'facebook', override:'contacts'})
      done()
    })
  })

  it('dynamic', function (done) {
    request.post(url('/connect/facebook/contacts'), {
      form:{scope:['scope1','scope2'], state:'Grant'},
      jar:request.jar(),
      followAllRedirects:true,
      json:true
    }, function (err, res, body) {
      should.deepEqual(body, {provider:'facebook', override:'contacts',
        dynamic:{scope:['scope1','scope2'], state:'Grant'}, state:'Grant'})
      done()
    })
  })

  it('step1', function (done) {
    request.get(url('/connect/twitter'), {
      jar:request.jar(),
      json:true
    }, function (err, res, body) {
      should.deepEqual(body, {provider:'twitter', step1:{oauth_token:'token'}})
      done()
    })
  })

  after(function (done) {
    server.close(done)
  })
})
