'use strict'

var request = require('request')
  , should = require('should')
  , qs = require('qs')
var koa = require('koa')
  , session = require('koa-session')
  , bodyParser = require('koa-bodyparser')
  , router = require('koa-router')
  , mount = require('koa-mount')
  , koaqs = require('koa-qs')
var Grant = require('../../../').koa()


describe('session - koa', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var config = {
    server: {protocol:'http', host:'localhost:5000'},
    facebook:{}, twitter:{}
  }
  var server, grant

  before(function (done) {
    grant = new Grant(config)

    var app = koa()
    app.keys = ['grant']
    app.use(session(app))
    app.use(bodyParser())
    app.use(mount(grant))
    app.use(router(app))
    koaqs(app)

    grant.config.facebook.authorize_url = '/authorize_url'
    grant.config.twitter.request_url = url('/request_url')
    grant.config.twitter.authorize_url = '/authorize_url'

    app.post('/request_url', function* (next) {
      this.body = qs.stringify({oauth_token:'token'})
    })
    app.get('/authorize_url', function* (next) {
      this.body = JSON.stringify(this.session.grant)
    })

    server = app.listen(5000, done)
  })

  it('provider', function (done) {
    request.get(url('/connect/facebook'), {
      jar:request.jar(),
      json:true
    }, function (err, res, body) {
      should.deepEqual(body, {provider:'facebook', dynamic:{}})
      done()
    })
  })

  it('override', function (done) {
    request.get(url('/connect/facebook/contacts'), {
      jar:request.jar(),
      json:true
    }, function (err, res, body) {
      should.deepEqual(body, {provider:'facebook', override:'contacts', dynamic:{}})
      done()
    })
  })

  it('dynamic - POST', function (done) {
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

  it('dynamic - GET', function (done) {
    request.get(url('/connect/facebook/contacts'), {
      qs:{scope:['scope1','scope2'], state:'Grant'},
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
      should.deepEqual(body, {provider:'twitter', step1:{oauth_token:'token'}, dynamic:{}})
      done()
    })
  })

  it('state auto generated', function (done) {
    grant.config.facebook.state = true
    request.get(url('/connect/facebook'), {
      jar:request.jar(),
      followAllRedirects:true,
      json:true
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
