'use strict'

var should = require('should')
  , qs = require('qs')
var Grant = require('../').express()
  , utils = require('../lib/utils')


describe('utils', function () {
  var grant

  before(function () {
    grant = new Grant({
      server: {protocol: 'http', host: 'localhost:5000', callback: '/'},
      concur: {}, elance: {}, facebook: {}, getpocket: {}, twitter: {}, yammer: {}
    })
  })

  describe('redirect_uri', function () {
    it('default', function () {
      utils.redirect_uri(grant.config.facebook)
        .should.equal('http://localhost:5000/connect/facebook/callback')
    })
    it('override', function () {
      grant.config.facebook.redirect_uri = 'http://localhost:5000'
      utils.redirect_uri(grant.config.facebook)
        .should.equal('http://localhost:5000')
    })
  })

  describe('toQuerystring', function () {
    it('parse json', function () {
      var str = utils.toQuerystring({}, '{"some":"data"}')
      should.deepEqual(qs.parse(str), {raw: {some: 'data'}})
    })
    it('parse querystring', function () {
      var str = utils.toQuerystring({}, 'some=data')
      should.deepEqual(qs.parse(str), {raw: {some: 'data'}})
    })
    it('concur', function () {
      var body =
        '<Access_Token>\r\n' +
        '  <Instance_Url>https://www.concursolutions.com/</Instance_Url>\r\n' +
        '  <Token>q962LLopjMgTOeTn3fRN+5uABCg=</Token>\r\n' +
        '  <Expiration_date>9/25/2016 1:36:50 PM</Expiration_date>\r\n' +
        '  <Refresh_Token>AXvRqWeb77Lq9F2WK6TXLCSTuxpwZO6</Refresh_Token>\r\n' +
        '</Access_Token>'
      var str = utils.toQuerystring(grant.config.concur, body)
      should.deepEqual(qs.parse(str), {
        access_token: 'q962LLopjMgTOeTn3fRN+5uABCg=',
        refresh_token: 'AXvRqWeb77Lq9F2WK6TXLCSTuxpwZO6',
        raw: body
      })
    })
    it('elance', function () {
      var str = utils.toQuerystring(grant.config.elance,
        {data: {access_token: 'token', refresh_token: 'refresh'}})
      should.deepEqual(qs.parse(str), {access_token: 'token', refresh_token: 'refresh',
        raw: {data: {access_token: 'token', refresh_token: 'refresh'}}})
    })
    it('getpocket', function () {
      var str = utils.toQuerystring(grant.config.getpocket, {access_token: 'token'})
      should.deepEqual(qs.parse(str),
        {access_token: 'token', raw: {access_token: 'token'}})
    })
    it('yammer', function () {
      var str = utils.toQuerystring(grant.config.yammer, {access_token: {token: 'token'}})
      should.deepEqual(qs.parse(str),
        {access_token: 'token', raw: {access_token: {token: 'token'}}})
    })
    it('oauth1', function () {
      var str = utils.toQuerystring(grant.config.twitter,
        {oauth_token: 'token', oauth_token_secret: 'secret'})
      should.deepEqual(qs.parse(str),
        {access_token: 'token', access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}})
    })
    it('oauth2', function () {
      var str = utils.toQuerystring(grant.config.facebook,
        {access_token: 'token', refresh_token: 'refresh'})
      should.deepEqual(qs.parse(str),
        {access_token: 'token', refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh'}})
    })
  })

  describe('error', function () {
    it('http error', function () {
      var str = utils.error(new Error('HTTP error'))
      should.deepEqual(qs.parse(str), {error: {error: 'HTTP error'}})
    })
    it('response error', function () {
      var str = utils.error(null, {statusCode: 500}, {some: 'data'})
      should.deepEqual(qs.parse(str), {error: {some: 'data'}})
    })
  })
})
