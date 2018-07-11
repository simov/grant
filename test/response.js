
var t = require('assert')
var qs = require('qs')
var Grant = require('../').express()
var response = require('../lib/response')


describe('response', () => {
  var grant

  before(() => {
    grant = new Grant({
      server: {protocol: 'http', host: 'localhost:5000', callback: '/'},
      concur: {}, facebook: {}, getpocket: {}, twitter: {}, yammer: {}
    })
  })

  it('concur', () => {
    var body =
      '<Access_Token>\r\n' +
      '  <Instance_Url>https://www.concursolutions.com/</Instance_Url>\r\n' +
      '  <Token>q962LLopjMgTOeTn3fRN+5uABCg=</Token>\r\n' +
      '  <Expiration_date>9/25/2016 1:36:50 PM</Expiration_date>\r\n' +
      '  <Refresh_Token>AXvRqWeb77Lq9F2WK6TXLCSTuxpwZO6</Refresh_Token>\r\n' +
      '</Access_Token>'
    var str = response(grant.config.concur, body)
    t.deepEqual(qs.parse(str), {
      access_token: 'q962LLopjMgTOeTn3fRN+5uABCg=',
      refresh_token: 'AXvRqWeb77Lq9F2WK6TXLCSTuxpwZO6',
      raw: body
    })
  })
  it('getpocket', () => {
    t.deepEqual(
      response(
        grant.config.getpocket,
        {access_token: 'token'}
      ),
      {access_token: 'token', raw: {access_token: 'token'}}
    )
  })
  it('yammer', () => {
    t.deepEqual(
      response(
        grant.config.yammer,
        {access_token: {token: 'token'}}
      ),
      {access_token: 'token', raw: {access_token: {token: 'token'}}}
    )
  })
  it('oauth1', () => {
    t.deepEqual(
      response(grant.config.twitter,
        {oauth_token: 'token', oauth_token_secret: 'secret'}
      ),
      {
        access_token: 'token', access_secret: 'secret',
        raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
      }
    )
  })
  it('oauth2', () => {
    t.deepEqual(
      response(grant.config.facebook,
        {access_token: 'token', refresh_token: 'refresh'}
      ),
      {
        access_token: 'token', refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh'}
      }
    )
  })
})
