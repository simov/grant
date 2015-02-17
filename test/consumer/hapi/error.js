
var request = require('request')
  , should = require('should')
  , qs = require('qs')
var Hapi = require('hapi')
  , yar = require('yar')
var Grant = require('../../../').hapi()


describe('error - hapi', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var config = {server: {protocol:'http', host:'localhost:5000', callback:'/'}}
  var server

  describe('oauth2', function () {
    describe('step1 - missing code', function () {
      before(function (done) {
        var grant = new Grant(config)

        server = new Hapi.Server()
        server.connection({host:'localhost', port:5000})

        server.route({method:'GET', path:'/authorize_url', handler: function (req, res) {
          res.redirect(url('/connect/facebook/callback?'+
            'error%5Bmessage%5D=invalid&error%5Bcode%5D=500'))
        }})
        server.route({method:'GET', path:'/', handler: function (req, res) {
          res(JSON.stringify(req.query))
        }})
        
        server.register([
          {register:grant, options:config},
          {register:yar, options:{cookieOptions:{password:'password', isSecure:false}}}
        ], function (err) {
          if (err) return done(err)

          grant.register.config.facebook.authorize_url = url('/authorize_url')

          server.start(done)
        })
      })

      it('authorize', function (done) {
        request.get(url('/connect/facebook'), {
          jar:request.jar(),
          json:true
        }, function (err, res, body) {
          should.deepEqual(body, {error: {error:{message:'invalid', code:'500'}}})
          done()
        })
      })

      after(function (done) {
        server.stop(done)
      })
    })

    describe('step1 - state mismatch', function () {
      before(function (done) {
        var grant = new Grant()

        server = new Hapi.Server()
        server.connection({host:'localhost', port:5000})

        server.route({method:'GET', path:'/authorize_url', handler: function (req, res) {
          res.redirect(url('/connect/facebook/callback?'+
            'code=code&state=Purest'))
        }})
        server.route({method:'GET', path:'/', handler: function (req, res) {
          res(JSON.stringify(req.query))
        }})

        server.register([
          {register:grant, options:config},
          {register:yar, options:{cookieOptions:{password:'password', isSecure:false}}}
        ], function (err) {
          if (err) return done(err)

          grant.register.config.facebook.authorize_url = url('/authorize_url')
          grant.register.config.facebook.state = 'Grant'

          server.start(done)
        })
      })

      it('authorize', function (done) {
        request.get(url('/connect/facebook'), {
          jar:request.jar(),
          json:true
        }, function (err, res, body) {
          should.deepEqual(body, {error: {error:'Grant: OAuth2 state mismatch'}})
          done()
        })
      })

      after(function (done) {
        server.stop(done)
      })
    })

    describe('step2 - error response', function () {
      before(function (done) {
        var grant = new Grant(config)

        server = new Hapi.Server()
        server.connection({host:'localhost', port:5000})

        server.route({method:'GET', path:'/authorize_url', handler: function (req, res) {
          res.redirect(url('/connect/facebook/callback?code=code'))
        }})
        server.route({method:'POST', path:'/access_url', handler: function (req, res) {
          res('error%5Bmessage%5D=invalid&error%5Bcode%5D=500').code(500)
        }})
        server.route({method:'GET', path:'/', handler: function (req, res) {
          res(JSON.stringify(req.query))
        }})

        server.register([
          {register:grant, options:config},
          {register:yar, options:{cookieOptions:{password:'password', isSecure:false}}}
        ], function (err) {
          if (err) return done(err)

          grant.register.config.facebook.authorize_url = url('/authorize_url')
          grant.register.config.facebook.access_url = url('/access_url')

          server.start(done)
        })
      })

      it('access', function (done) {
        request.get(url('/connect/facebook'), {
          jar:request.jar(),
          json:true
        }, function (err, res, body) {
          should.deepEqual(body, {error: {error:{message:'invalid', code:'500'}}})
          done()
        })
      })

      after(function (done) {
        server.stop(done)
      })
    })
  })
})
