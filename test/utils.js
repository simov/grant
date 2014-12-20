
var should = require('should')
  qs = require('qs')
var Grant = require('../'),
  utils = require('../lib/utils')


describe('options', function () {
  var grant

  before(function () {
    grant = new Grant({server: {protocol:'http', host:'localhost:5000', callback:'/'}})
  })

  it('redirect_uri', function () {
    utils.redirect_uri(grant.config.facebook)
      .should.equal('http://localhost:5000/connect/facebook/callback')
  })

  describe('toQuerystring', function () {
    it('parse json', function () {
      var str = utils.toQuerystring({}, '{"some":"data"}')
      should.deepEqual(qs.parse(str), {raw:{some:'data'}})
    })
    it('parse querystring', function () {
      var str = utils.toQuerystring({}, 'some=data')
      should.deepEqual(qs.parse(str), {raw:{some:'data'}})
    })
    it('getpocket', function () {
      var str = utils.toQuerystring(grant.config.getpocket, {access_token:'token'})
      should.deepEqual(qs.parse(str),
        {access_token:'token', raw:{access_token:'token'}})
    })
    it('yammer', function () {
      var str = utils.toQuerystring(grant.config.yammer, {access_token:{token:'token'}})
      should.deepEqual(qs.parse(str),
        {access_token:'token', raw:{access_token:{token:'token'}}})
    })
    it('oauth1', function () {
      var str = utils.toQuerystring(grant.config.twitter,
        {oauth_token:'token', oauth_token_secret:'secret'})
      should.deepEqual(qs.parse(str),
        {access_token:'token', access_secret:'secret',
        raw:{oauth_token:'token', oauth_token_secret:'secret'}})
    })
    it('oauth2', function () {
      var str = utils.toQuerystring(grant.config.facebook,
        {access_token:'token', refresh_token:'refresh'})
      should.deepEqual(qs.parse(str),
        {access_token:'token', refresh_token:'refresh',
        raw:{access_token:'token', refresh_token:'refresh'}})
    })
  })

  describe('error', function () {
    it('http error', function () {
      var str = utils.error(new Error('HTTP error'))
      should.deepEqual(qs.parse(str), {error:{error:'HTTP error'}})
    })
    it('response error', function () {
      var str = utils.error(null, {statusCode:500}, {some:'data'})
      should.deepEqual(qs.parse(str), {error:{some:'data'}})
    })
  })
})
