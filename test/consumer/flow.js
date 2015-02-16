
var express = require('express')
  , Hapi = require('hapi')
  , yar = require('yar')
  , request = require('request')
  , should = require('should')
  , qs = require('qs')


describe('flow', function () {
  function url (path) {
    var c = _config.server
    return c.protocol + '://' + c.host + path
  }

  var _config = {server: {protocol:'http', host:'localhost:5000', callback:'/'}}
  var server

  describe('oauth1', function () {
    describe('express', function () {
      before(function (done) {
        var Grant = require('../../').express()
        var grant = new Grant(_config)
        var app = express().use(grant)

        grant.config.twitter.request_url = url('/request_url')
        grant.config.twitter.authorize_url = url('/authorize_url')
        grant.config.twitter.access_url = url('/access_url')

        app.post('/request_url', function (req, res) {
          res.end(qs.stringify({oauth_token:'token', oauth_token_secret:'secret'}))
        })
        app.get('/authorize_url', function (req, res) {
          res.redirect(url('/connect/twitter/callback?'+qs.stringify({
            oauth_token:'token', oauth_verifier:'verifier'
          })))
        })
        app.post('/access_url', function (req, res) {
          res.end(JSON.stringify({
            oauth_token:'token', oauth_token_secret:'secret'
          }))
        })
        app.get('/', function (req, res) {
          res.end(JSON.stringify(req.query))
        })
        server = app.listen(5000, done)
      })

      test()

      after(function (done) {
        server.close(done)
      })
    })

    describe('hapi', function () {
      before(function (done) {
        var Grant = require('../../').hapi()
        var grant = new Grant()

        server = new Hapi.Server()
        server.connection({host:'localhost', port:5000})

        server.route({method:'POST', path:'/request_url', handler: function (req, res) {
          res(qs.stringify({oauth_token:'token', oauth_token_secret:'secret'}))
        }})
        server.route({method:'GET', path:'/authorize_url', handler: function (req, res) {
          res.redirect(url('/connect/twitter/callback?'+qs.stringify({
            oauth_token:'token', oauth_verifier:'verifier'
          })))
        }})
        server.route({method:'POST', path:'/access_url', handler: function (req, res) {
          res(JSON.stringify({
            oauth_token:'token', oauth_token_secret:'secret'
          }))
        }})
        server.route({method:'GET', path:'/', handler: function (req, res) {
          res(JSON.stringify(req.query))
        }})

        server.register([
          {register:grant, options:_config},
          {register:yar, options:{cookieOptions:{password:'password', isSecure:false}}}
        ], function (err) {
          if (err) return done(err)

          grant.register.config.twitter.request_url = url('/request_url')
          grant.register.config.twitter.authorize_url = url('/authorize_url')
          grant.register.config.twitter.access_url = url('/access_url')

          server.start(done)
        })
      })

      test()

      after(function (done) {
        server.stop(done)
      })
    })

    function test () {
      it('twitter', function (done) {
        request.get(url('/connect/twitter'), {
          jar:request.jar(),
          json:true
        }, function (err, res, body) {
          should.deepEqual(body, {
            access_token:'token', access_secret:'secret',
            raw: {oauth_token:'token', oauth_token_secret:'secret'}
          })
          done()
        })
      })
    }
  })

  describe('oauth2', function () {
    describe('express', function () {
      before(function (done) {
        var Grant = require('../../').express()
        var grant = new Grant(_config)
        var app = express().use(grant)

        grant.config.facebook.authorize_url = url('/authorize_url')
        grant.config.facebook.access_url = url('/access_url')

        app.get('/authorize_url', function (req, res) {
          res.redirect(url('/connect/facebook/callback?code=code'))
        })
        app.post('/access_url', function (req, res) {
          res.end(JSON.stringify({
            access_token:'token', refresh_token:'refresh', expires_in:3600
          }))
        })
        app.get('/', function (req, res) {
          res.end(JSON.stringify(req.query))
        })
        server = app.listen(5000, done)
      })

      test()

      after(function (done) {
        server.close(done)
      })
    })

    describe('hapi', function () {
      before(function (done) {
        var Grant = require('../../').hapi()
        var grant = new Grant()

        server = new Hapi.Server()
        server.connection({host:'localhost', port:5000})

        server.route({method:'GET', path:'/authorize_url', handler: function (req, res) {
          res.redirect(url('/connect/facebook/callback?code=code'))
        }})
        server.route({method:'POST', path:'/access_url', handler: function (req, res) {
          res(JSON.stringify({
            access_token:'token', refresh_token:'refresh', expires_in:3600
          }))
        }})
        server.route({method:'GET', path:'/', handler: function (req, res) {
          res(JSON.stringify(req.query))
        }})

        server.register([
          {register:grant, options:_config},
          {register:yar, options:{cookieOptions:{password:'password', isSecure:false}}}
        ], function (err) {
          if (err) return done(err)

          grant.register.config.facebook.authorize_url = url('/authorize_url')
          grant.register.config.facebook.access_url = url('/access_url')

          server.start(done)
        })
      })

      test()

      after(function (done) {
        server.stop(done)
      })
    })
    
    function test () {
      it('facebook', function (done) {
        request.get(url('/connect/facebook'), {
          jar:request.jar(),
          json:true
        }, function (err, res, body) {
          should.deepEqual(body, {
            access_token:'token', refresh_token:'refresh',
            raw: {access_token:'token', refresh_token:'refresh', expires_in:3600}
          })
          done()
        })
      })
    }
  })

  describe('custom', function () {
    describe('express', function () {
      before(function (done) {
        var Grant = require('../../').express()
        var grant = new Grant(_config)
        var app = express().use(grant)

        grant.config.getpocket.request_url = url('/request_url')
        grant.config.getpocket.authorize_url = url('/authorize_url')
        grant.config.getpocket.access_url = url('/access_url')

        app.post('/request_url', function (req, res) {
          res.end(qs.stringify({code:'code'}))
        })
        app.get('/authorize_url', function (req, res) {
          res.redirect(url('/connect/getpocket/callback?'+qs.stringify({
            request_token:'token'
          })))
        })
        app.post('/access_url', function (req, res) {
          res.end(JSON.stringify({
            access_token:'token', username:'grant'
          }))
        })
        app.get('/', function (req, res) {
          res.end(JSON.stringify(req.query))
        })
        server = app.listen(5000, done)
      })

      test()

      after(function (done) {
        server.close(done)
      })
    })

    describe('hapi', function () {
      before(function (done) {
        var Grant = require('../../').hapi()
        var grant = new Grant()

        server = new Hapi.Server()
        server.connection({host:'localhost', port:5000})

        server.route({method:'POST', path:'/request_url', handler: function (req, res) {
          res(qs.stringify({code:'code'}))
        }})
        server.route({method:'GET', path:'/authorize_url', handler: function (req, res) {
          res.redirect(url('/connect/getpocket/callback?'+qs.stringify({
            request_token:'token'
          })))
        }})
        server.route({method:'POST', path:'/access_url', handler: function (req, res) {
          res(JSON.stringify({
            access_token:'token', username:'grant'
          }))
        }})
        server.route({method:'GET', path:'/', handler: function (req, res) {
          res(JSON.stringify(req.query))
        }})

        server.register([
          {register:grant, options:_config},
          {register:yar, options:{cookieOptions:{password:'password', isSecure:false}}}
        ], function (err) {
          if (err) return done(err)

          grant.register.config.getpocket.request_url = url('/request_url')
          grant.register.config.getpocket.authorize_url = url('/authorize_url')
          grant.register.config.getpocket.access_url = url('/access_url')

          server.start(done)
        })
      })

      test()

      after(function (done) {
        server.stop(done)
      })
    })

    function test () {
      it('getpocket', function (done) {
        request.get(url('/connect/getpocket'), {
          jar:request.jar(),
          json:true
        }, function (err, res, body) {
          should.deepEqual(body, {
            access_token:'token',
            raw: {access_token:'token', username:'grant'}
          })
          done()
        })
      })
    }
  })
})
