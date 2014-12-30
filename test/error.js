
var express = require('express'),
  request = require('request'),
  should = require('should'),
  qs = require('qs')
var Grant = require('../').express()


describe('error', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var grant, app, server
  var config = {server: {protocol:'http', host:'localhost:5000', callback:'/'}}

  describe('oauth2', function () {
    describe('authorize', function () {
      before(function (done) {
        grant = new Grant(config)
        app = express().use(grant)

        grant.config.facebook.authorize_url = url('/authorize_url')

        app.get('/authorize_url', function (req, res) {
          res.redirect(url('/connect/facebook/callback?'+
            'error%5Bmessage%5D=invalid&error%5Bcode%5D=500'))
        })

        app.get('/', function (req, res) {
          res.end(JSON.stringify(req.query))
        })

        server = app.listen(5000, done)
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
        server.close(done)
      })
    })

    describe('access', function () {
      before(function (done) {
        grant = new Grant(config)
        app = express().use(grant)

        grant.config.facebook.authorize_url = url('/authorize_url')
        grant.config.facebook.access_url = url('/access_url')

        app.get('/authorize_url', function (req, res) {
          res.redirect(url('/connect/facebook/callback?code=code'))
        })

        app.post('/access_url', function (req, res) {
          res.status(500).end('error%5Bmessage%5D=invalid&error%5Bcode%5D=500')
        })

        app.get('/', function (req, res) {
          res.end(JSON.stringify(req.query))
        })

        server = app.listen(5000, done)
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
        server.close(done)
      })
    })
  })
})
