'use strict'

var t = require('assert')
var qs = require('qs')
var request = require('request')
var express = require('express')
var bodyParser = require('body-parser')
var session = require('express-session')
var Grant = require('../../../').express()


describe('session - express', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var config = {
    server: {protocol: 'http', host: 'localhost:5000'},
    facebook: {}, twitter: {}
  }
  var server, grant

  before(function (done) {
    grant = new Grant(config)
    var app = express()
    app.use(bodyParser.urlencoded({extended: true}))
    app.use(session({secret: 'grant', saveUninitialized: true, resave: true}))
    app.use(grant)

    grant.config.facebook.authorize_url = '/authorize_url'
    grant.config.twitter.request_url = url('/request_url')
    grant.config.twitter.authorize_url = '/authorize_url'

    app.post('/request_url', function (req, res) {
      res.end(qs.stringify({oauth_token: 'token'}))
    })
    app.get('/authorize_url', function (req, res) {
      res.end(JSON.stringify(req.session.grant))
    })
    server = app.listen(5000, done)
  })

  it('provider', function (done) {
    request.get(url('/connect/facebook'), {
      jar: request.jar(),
      json: true
    }, function (err, res, body) {
      t.deepEqual(body, {provider: 'facebook'})
      done()
    })
  })

  it('override', function (done) {
    request.get(url('/connect/facebook/contacts'), {
      jar: request.jar(),
      json: true
    }, function (err, res, body) {
      t.deepEqual(body, {provider: 'facebook', override: 'contacts'})
      done()
    })
  })

  it('dynamic - POST', function (done) {
    request.post(url('/connect/facebook/contacts'), {
      form: {scope: ['scope1', 'scope2'], state: 'Grant'},
      jar: request.jar(),
      followAllRedirects: true,
      json: true
    }, function (err, res, body) {
      t.deepEqual(body, {provider: 'facebook', override: 'contacts',
        dynamic: {scope: ['scope1', 'scope2'], state: 'Grant'}, state: 'Grant'})
      done()
    })
  })

  it('dynamic - GET', function (done) {
    request.get(url('/connect/facebook/contacts'), {
      qs: {scope: ['scope1', 'scope2'], state: 'Grant'},
      jar: request.jar(),
      followAllRedirects: true,
      json: true
    }, function (err, res, body) {
      t.deepEqual(body, {provider: 'facebook', override: 'contacts',
        dynamic: {scope: ['scope1', 'scope2'], state: 'Grant'}, state: 'Grant'})
      done()
    })
  })

  it('dynamic - non configured provider', function (done) {
    var authorize_url = grant._config.oauth.google.authorize_url
    grant._config.oauth.google.authorize_url = '/authorize_url'
    t.equal(grant.config.google, undefined)

    request.get(url('/connect/google'), {
      qs: {scope: ['scope1', 'scope2'], state: 'Grant'},
      jar: request.jar(),
      followAllRedirects: true,
      json: true
    }, function (err, res, body) {
      t.deepEqual(body, {provider: 'google',
        dynamic: {scope: ['scope1', 'scope2'], state: 'Grant'}, state: 'Grant'})
      t.ok(typeof grant.config.google === 'object')
      grant._config.oauth.google.authorize_url = authorize_url
      done()
    })
  })

  it('step1', function (done) {
    request.get(url('/connect/twitter'), {
      jar: request.jar(),
      json: true
    }, function (err, res, body) {
      t.deepEqual(body, {provider: 'twitter', step1: {oauth_token: 'token'}})
      done()
    })
  })

  it('state auto generated', function (done) {
    grant.config.facebook.state = true
    request.get(url('/connect/facebook'), {
      jar: request.jar(),
      followAllRedirects: true,
      json: true
    }, function (err, res, body) {
      t.ok(/\d+/.test(body.state))
      t.ok(typeof body.state === 'string')
      done()
    })
  })

  after(function (done) {
    server.close(done)
  })
})
