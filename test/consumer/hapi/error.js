'use strict'

var t = require('assert')
var urlib = require('url')
var qs = require('qs')
var request = require('request')
var Hapi = require('hapi')
var yar = require('yar')
var Grant = require('../../../').hapi()


describe('error - hapi', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var config = {
    server: {protocol: 'http', host: 'localhost:5000', callback: '/'},
    facebook: {}
  }

  describe('missing plugin', function () {
    describe('session', function () {
      var server
      before(function (done) {
        var grant = new Grant()
        server = new Hapi.Server({debug: {request: false}})
        server.connection({host: 'localhost', port: 5000})

        server.register([{register: grant, options: config}], function (err) {
          if (err) {
            done(err)
            return
          }

          server.on('request-error', function (req, err) {
            t.equal(err.message, 'Uncaught error: Grant: register session plugin first')
          })

          server.start(done)
        })
      })

      it('', (done) => {
        request.get(url('/connect/facebook'), {
          jar: request.jar(),
          json: true
        }, function (err, res, body) {
          t.equal(body.statusCode, 500)
          done()
        })
      })

      after(function (done) {
        server.stop(done)
      })
    })
  })

  describe('oauth2', function () {
    describe('step1 - missing code', function () {
      var server
      before(function (done) {
        var grant = new Grant()

        server = new Hapi.Server()
        server.connection({host: 'localhost', port: 5000})

        server.route({method: 'GET', path: '/authorize_url', handler: function (req, res) {
          res.redirect(url('/connect/facebook/callback?' +
            qs.stringify({error: {message: 'invalid', code: '500'}})))
        }})
        server.route({method: 'GET', path: '/', handler: function (req, res) {
          var parsed = urlib.parse(req.url, false)
          var query = qs.parse(parsed.query)
          res(query)
        }})

        server.register([
          {register: grant, options: config},
          {register: yar, options: {cookieOptions: {password: '01234567890123456789012345678912', isSecure: false}}}
        ], function (err) {
          if (err) {
            done(err)
            return
          }

          grant.config.facebook.authorize_url = url('/authorize_url')

          server.start(done)
        })
      })

      it('authorize', function (done) {
        request.get(url('/connect/facebook'), {
          jar: request.jar(),
          json: true
        }, function (err, res, body) {
          t.deepEqual(body, {error: {error: {message: 'invalid', code: '500'}}})
          done()
        })
      })

      after(function (done) {
        server.stop(done)
      })
    })

    describe('step1 - state mismatch', function () {
      var server
      before(function (done) {
        var grant = new Grant()

        server = new Hapi.Server()
        server.connection({host: 'localhost', port: 5000})

        server.route({method: 'GET', path: '/authorize_url', handler: function (req, res) {
          res.redirect(url('/connect/facebook/callback?' +
            qs.stringify({code: 'code', state: 'Purest'})))
        }})
        server.route({method: 'GET', path: '/', handler: function (req, res) {
          var parsed = urlib.parse(req.url, false)
          var query = qs.parse(parsed.query)
          res(query)
        }})

        server.register([
          {register: grant, options: config},
          {register: yar, options: {cookieOptions: {password: '01234567890123456789012345678912', isSecure: false}}}
        ], function (err) {
          if (err) {
            done(err)
            return
          }

          grant.config.facebook.authorize_url = url('/authorize_url')
          grant.config.facebook.state = 'Grant'

          server.start(done)
        })
      })

      it('authorize', function (done) {
        request.get(url('/connect/facebook'), {
          jar: request.jar(),
          json: true
        }, function (err, res, body) {
          t.deepEqual(body, {error: {error: 'Grant: OAuth2 state mismatch'}})
          done()
        })
      })

      after(function (done) {
        server.stop(done)
      })
    })

    describe('step2 - error response', function () {
      var server
      before(function (done) {
        var grant = new Grant()

        server = new Hapi.Server()
        server.connection({host: 'localhost', port: 5000})

        server.route({method: 'GET', path: '/authorize_url', handler: function (req, res) {
          res.redirect(url('/connect/facebook/callback?code=code'))
        }})
        server.route({method: 'POST', path: '/access_url', handler: function (req, res) {
          res(qs.stringify({error: {message: 'invalid', code: '500'}})).code(500)
        }})
        server.route({method: 'GET', path: '/', handler: function (req, res) {
          var parsed = urlib.parse(req.url, false)
          var query = qs.parse(parsed.query)
          res(query)
        }})

        server.register([
          {register: grant, options: config},
          {register: yar, options: {cookieOptions: {password: '01234567890123456789012345678912', isSecure: false}}}
        ], function (err) {
          if (err) {
            done(err)
            return
          }

          grant.config.facebook.authorize_url = url('/authorize_url')
          grant.config.facebook.access_url = url('/access_url')

          server.start(done)
        })
      })

      it('access', function (done) {
        request.get(url('/connect/facebook'), {
          jar: request.jar(),
          json: true
        }, function (err, res, body) {
          t.deepEqual(body, {error: {error: {message: 'invalid', code: '500'}}})
          done()
        })
      })

      after(function (done) {
        server.stop(done)
      })
    })
  })

  describe('missing provider', function () {
    var grant, server, jar = request.jar()
    before(function (done) {
      grant = new Grant()

      server = new Hapi.Server()
      server.connection({host: 'localhost', port: 5000})

      server.route({method: 'GET', path: '/', handler: function (req, res) {
        var parsed = urlib.parse(req.url, false)
        var query = qs.parse(parsed.query)
        res(query).header('x-test', true)
      }})

      server.register([
        {register: grant, options: config},
        {register: yar, options: {cookieOptions: {password: '01234567890123456789012345678912', isSecure: false}}}
      ], function (err) {
        if (err) {
          done(err)
          return
        }

        server.start(done)
      })
    })

    it('connect', function (done) {
      delete grant.config.facebook.oauth
      request.get(url('/connect/facebook'), {
        jar: jar,
        json: true
      }, function (err, res, body) {
        t.equal(res.headers['x-test'], 'true')
        t.deepEqual(body, {
          error: 'Grant: missing or misconfigured provider'})
        done()
      })
    })
    it('connect - no callback', function (done) {
      delete grant.config.facebook.callback
      request.get(url('/connect/facebook'), {
        jar: jar,
        json: true
      }, function (err, res, body) {
        t.equal(res.headers['x-test'], undefined)
        t.deepEqual(qs.parse(body), {
          error: 'Grant: missing or misconfigured provider'})
        done()
      })
    })

    it('callback', function (done) {
      grant.config.facebook.callback = '/'
      request.get(url('/connect/facebook/callback'), {
        jar: jar,
        json: true
      }, function (err, res, body) {
        t.equal(res.headers['x-test'], 'true')
        t.deepEqual(body, {
          error: 'Grant: missing session or misconfigured provider'})
        done()
      })
    })
    it('callback - no callback', function (done) {
      delete grant.config.facebook.callback
      request.get(url('/connect/facebook/callback'), {
        jar: jar,
        json: true
      }, function (err, res, body) {
        t.equal(res.headers['x-test'], undefined)
        t.deepEqual(qs.parse(body), {
          error: 'Grant: missing session or misconfigured provider'})
        done()
      })
    })

    after(function (done) {
      server.stop(done)
    })
  })
})
