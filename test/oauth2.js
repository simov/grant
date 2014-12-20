
var express = require('express'),
  request = require('request'),
  should = require('should'),
  qs = require('qs')
var Grant = require('../'),
  oauth2 = require('../lib/oauth2')


describe('oauth2', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var grant, app, server
  var config = {server: {protocol:'http', host:'localhost:5000', callback:'/'}}

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
    var url = oauth2.step1(grant.config.facebook);
    url.should.equal('/authorize_url?response_type=code'+
      '&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fconnect%2Ffacebook%2Fcallback')
  })

  it('step2', function (done) {
    oauth2.step2(grant.config.facebook, {code:'code'}, function (err, body) {
      should.deepEqual(JSON.parse(body), {some:'data'});
      done()
    })
  })

  it('step3', function () {
    var url = oauth2.step3(grant.config.facebook, {some:'data'})
    url.should.equal('/?raw%5Bsome%5D=data')
  })

  after(function () {
    server.close()
  })
})
