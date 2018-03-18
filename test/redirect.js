
var t = require('assert')
var Grant = require('../').express()
var redirect = require('../lib/redirect')


describe('redirect', () => {
  var grant

  before(() => {
    grant = new Grant({
      server: {protocol: 'http', host: 'localhost:5000', callback: '/'},
      facebook: {}
    })
  })

  it('default', () => {
    t.equal(
      redirect(grant.config.facebook),
      'http://localhost:5000/connect/facebook/callback'
    )
  })
  it('path prefix', () => {
    grant.config.facebook.path = '/path/prefix'
    t.equal(
      redirect(grant.config.facebook),
      'http://localhost:5000/path/prefix/connect/facebook/callback'
    )
  })
  it('override', () => {
    grant.config.facebook.redirect_uri = 'http://localhost:5000'
    t.equal(
      redirect(grant.config.facebook),
      'http://localhost:5000'
    )
  })
})
