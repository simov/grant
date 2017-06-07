'use strict'

var t = require('assert')
var qs = require('qs')
var request = require('request')
var Koa = require('koa')
var session = require('koa-session')
var bodyParser = require('koa-bodyparser')
var mount = require('koa-mount')
var convert = require('koa-convert')
var koaqs = require('koa-qs')
var Grant = require('../../../').koa()


var _Koa = Koa
Koa = function () {
  var version = parseInt(require('koa/package.json').version.split('.')[0])

  var app = new _Koa()

  if (version >= 2) {
    var _use = app.use
    app.use = (mw) => _use.call(app, convert(mw))
  }

  return app
}

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

    var app = new Koa()
    app.keys = ['grant']
    app.use(session(app))
    app.use(bodyParser())
    app.use(mount(grant))
    koaqs(app)

    grant.config.facebook.authorize_url = '/authorize_url'
    grant.config.twitter.request_url = url('/request_url')
    grant.config.twitter.authorize_url = '/authorize_url'

    app.use(function* () {
      if (this.path === '/request_url') {
        this.body = qs.stringify({oauth_token: 'token'})
      }
      else if (this.path === '/authorize_url') {
        this.body = JSON.stringify(this.session.grant)
      }
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
    t.equal(grant.config.google, undefined)

    request.get(url('/connect/google'), {
      qs: {scope: ['scope1', 'scope2'], state: 'Grant',
        authorize_url: '/authorize_url'},
      jar: request.jar(),
      followAllRedirects: true,
      json: true
    }, function (err, res, body) {
      t.ok(typeof grant.config.google === 'object')
      t.deepEqual(body, {provider: 'google',
        dynamic: {scope: ['scope1', 'scope2'], state: 'Grant',
          authorize_url: '/authorize_url'}, state: 'Grant'})
      done()
    })
  })

  it('dynamic - non existing provider', function (done) {
    t.equal(grant.config.grant, undefined)

    request.get(url('/connect/grant'), {
      qs: {oauth: 2, authorize_url: '/authorize_url'},
      jar: request.jar(),
      followAllRedirects: true,
      json: true
    }, function (err, res, body) {
      t.equal(grant.config.grant, undefined)
      t.deepEqual(body, {provider: 'grant',
        dynamic: {oauth: '2', authorize_url: '/authorize_url'}})
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
