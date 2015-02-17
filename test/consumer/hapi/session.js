
var request = require('request')
  , should = require('should')
  , qs = require('qs')
var Hapi = require('hapi')
  , yar = require('yar')
var Grant = require('../../../').hapi()


describe('session - hapi', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var config = {server: {protocol:'http', host:'localhost:5000'}}
  var server

  before(function (done) {
    var grant = new Grant()
    
    server = new Hapi.Server()
    server.connection({host:'localhost', port:5000})

    server.route({method:'POST', path:'/request_url', handler: function (req, res) {
      res(qs.stringify({oauth_token:'token'}))
    }})
    server.route({method:'GET', path:'/authorize_url', handler: function (req, res) {
      res(JSON.stringify(req.session.get('grant')))
    }})

    server.register([
      {register:grant, options:config},
      {register:yar, options:{cookieOptions:{password:'password', isSecure:false}}}
    ], function (err) {
      if (err) return done(err)

      grant.register.config.facebook.authorize_url = '/authorize_url'
      grant.register.config.twitter.request_url = url('/request_url')
      grant.register.config.twitter.authorize_url = '/authorize_url'

      server.start(done)
    })
  })

  it('provider', function (done) {
    request.get(url('/connect/facebook'), {
      jar:request.jar(),
      json:true
    }, function (err, res, body) {
      should.deepEqual(body, {provider:'facebook'})
      done()
    })
  })

  it('override', function (done) {
    request.get(url('/connect/facebook/contacts'), {
      jar:request.jar(),
      json:true
    }, function (err, res, body) {
      should.deepEqual(body, {provider:'facebook', override:'contacts'})
      done()
    })
  })

  it('dynamic', function (done) {
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

  it('step1', function (done) {
    request.get(url('/connect/twitter'), {
      jar:request.jar(),
      json:true
    }, function (err, res, body) {
      should.deepEqual(body, {provider:'twitter', step1:{oauth_token:'token'}})
      done()
    })
  })

  after(function (done) {
    server.stop(done)
  })
})
