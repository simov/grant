'use strict'

var request = require('request')
var should = require('should')
var qs = require('qs')
var koa = require('koa')
var session = require('koa-session')
var bodyParser = require('koa-bodyparser')
var route = require('koa-route')
var mount = require('koa-mount')
var koaqs = require('koa-qs')
var Grant = require('../../../').koa()


describe('session - koa', function () {
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

    var app = koa()
    app.keys = ['grant']
    app.use(session(app))
    app.use(bodyParser())
    app.use(mount(grant))
    koaqs(app)

    grant.config.facebook.authorize_url = '/authorize_url'
    grant.config.twitter.request_url = url('/request_url')
    grant.config.twitter.authorize_url = '/authorize_url'

    app.use(route.post('/request_url', function* (next) {
      this.body = qs.stringify({oauth_token: 'token'})
    }))
    app.use(route.get('/authorize_url', function* (next) {
      this.body = JSON.stringify(this.session.grant)
    }))

    server = app.listen(5000, done)
  })

  it('provider', function (done) {
    request.get(url('/connect/facebook'), {
      jar: request.jar(),
      json: true
    }, function (err, res, body) {
      should.deepEqual(body, {provider: 'facebook'})
      done()
    })
  })

  it('override', function (done) {
    request.get(url('/connect/facebook/contacts'), {
      jar: request.jar(),
      json: true
    }, function (err, res, body) {
      should.deepEqual(body, {provider: 'facebook', override: 'contacts'})
      done()
    })
  })

  it('dynamic - POST', function (done) {
    request.post(url('/connect/facebook/contacts'), {
      form: {scope: ['scope1','scope2'], state: 'Grant'},
      jar: request.jar(),
      followAllRedirects: true,
      json: true
    }, function (err, res, body) {
      should.deepEqual(body, {provider: 'facebook', override: 'contacts',
        dynamic: {scope: ['scope1','scope2'], state: 'Grant'}, state: 'Grant'})
      done()
    })
  })

  it('dynamic - GET', function (done) {
    request.get(url('/connect/facebook/contacts'), {
      qs: {scope: ['scope1','scope2'], state: 'Grant'},
      jar: request.jar(),
      followAllRedirects: true,
      json: true
    }, function (err, res, body) {
      should.deepEqual(body, {provider: 'facebook', override: 'contacts',
        dynamic: {scope: ['scope1','scope2'], state: 'Grant'}, state: 'Grant'})
      done()
    })
  })

  it('dynamic - non configured provider', function (done) {
    var authorize_url = grant._config.oauth.google.authorize_url
    grant._config.oauth.google.authorize_url = '/authorize_url'
    should.equal(grant.config.google, undefined)

    request.get(url('/connect/google'), {
      qs: {scope: ['scope1','scope2'], state: 'Grant'},
      jar: request.jar(),
      followAllRedirects: true,
      json: true
    }, function (err, res, body) {
      should.deepEqual(body, {provider: 'google',
        dynamic: {scope: ['scope1','scope2'], state: 'Grant'}, state: 'Grant'})
      grant.config.google.should.be.type('object')
      grant._config.oauth.google.authorize_url = authorize_url
      done()
    })
  })

  it('step1', function (done) {
    request.get(url('/connect/twitter'), {
      jar: request.jar(),
      json: true
    }, function (err, res, body) {
      should.deepEqual(body, {provider: 'twitter', step1: {oauth_token: 'token'}})
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
      body.state.should.match(/\d+/)
      body.state.should.be.type('string')
      done()
    })
  })

  after(function (done) {
    server.close(done)
  })
})
