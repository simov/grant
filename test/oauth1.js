
var express = require('express'),
  request = require('request'),
  should = require('should'),
  qs = require('qs')
var Grant = require('../'),
  oauth1 = require('../lib/oauth1')


describe('oauth1', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var grant, app, server
  var config = {server: {protocol:'http', host:'localhost:5000', callback:'/'}}

  before(function (done) {
    grant = new Grant(config)
    app = express().use(grant)

    grant.config.twitter.request_url = url('/request_url')
    grant.config.twitter.authorize_url = '/authorize_url'
    grant.config.twitter.access_url = url('/access_url')

    app.post('/request_url', function (req, res) {
      res.end(qs.stringify({some:'data'}))
    })
    app.post('/access_url', function (req, res) {
      res.end(JSON.stringify({some:'data'}))
    })
    server = app.listen(5000, done)
  })

  it('step1', function (done) {
    oauth1.step1(grant.config.twitter, function (err, data) {
      should.deepEqual(data, {some:'data'})
      done()
    })
  })

  it('step2', function () {
    var url = oauth1.step2(grant.config.twitter, {oauth_token:'token'})
    url.should.equal('/authorize_url?oauth_token=token')
  })

  it('step3', function (done) {
    oauth1.step3(grant.config.twitter, {}, {}, function (err, url) {
      url.should.equal('/?raw%5Bsome%5D=data')
      done()
    })
  })

  after(function () {
    server.close()
  })
})
