'use strict'

var request = require('request')
  , should = require('should')
var express = require('express')
  , session = require('express-session')
var Grant = require('../../../').express()


describe('error - express', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var config = {
    server: {protocol:'http', host:'localhost:5000', callback:'/'},
    facebook:{}
  }

  describe('missing middleware', function () {
    it('session', function (done) {
      var grant = new Grant(config)
      var app = express().use(grant)
      app.use(function (err, req, res, next) {
        err.message.should.equal('Grant: mount session middleware first')
        next()
      })
      var server = app.listen(5000, function () {
        request.get(url('/connect/facebook'), {
          jar:request.jar(),
          json:true
        }, function (err, res, body) {
          body.match(/Error: Grant: mount session middleware first/)
          server.close(done)
        })
      })
    })

    it('body-parser', function (done) {
      var grant = new Grant(config)
      var app = express()
      app.use(session({secret:'grant', saveUninitialized:true, resave:true}))
      app.use(grant)
      app.use(function (err, req, res, next) {
        err.message.should.equal('Grant: mount body parser middleware first')
        next()
      })
      var server = app.listen(5000, function () {
        request.post(url('/connect/facebook'), {
          jar:request.jar(),
          json:true
        }, function (err, res, body) {
          body.match(/Error: Grant: mount body parser middleware first/)
          server.close(done)
        })
      })
    })
  })

  describe('oauth2', function () {
    describe('step1 - missing code', function () {
      var server
      before(function (done) {
        var grant = new Grant(config)
        var app = express()
        app.use(session({secret:'grant', saveUninitialized:true, resave:true}))
        app.use(grant)

        grant.config.facebook.authorize_url = url('/authorize_url')

        app.get('/authorize_url', function (req, res) {
          res.redirect(url('/connect/facebook/callback?' +
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

    describe('step1 - state mismatch', function () {
      var server
      before(function (done) {
        var grant = new Grant(config)
        var app = express()
        app.use(session({secret:'grant', saveUninitialized:true, resave:true}))
        app.use(grant)

        grant.config.facebook.authorize_url = url('/authorize_url')
        grant.config.facebook.state = 'Grant'

        app.get('/authorize_url', function (req, res) {
          res.redirect(url('/connect/facebook/callback?' +
            'code=code&state=Purest'))
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
          should.deepEqual(body, {error: {error:'Grant: OAuth2 state mismatch'}})
          done()
        })
      })

      after(function (done) {
        server.close(done)
      })
    })

    describe('step2 - error response', function () {
      var server
      before(function (done) {
        var grant = new Grant(config)
        var app = express()
        app.use(session({secret:'grant', saveUninitialized:true, resave:true}))
        app.use(grant)

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

  describe('missing provider', function () {
    var grant, server, jar = request.jar()
    before(function (done) {
      grant = new Grant(config)
      var app = express()
      app.use(session({secret:'grant', saveUninitialized:true, resave:true}))
      app.use(grant)

      app.get('/', function (req, res) {
        res.writeHead(200, {'x-test':true})
        res.end(JSON.stringify(req.query))
      })
      server = app.listen(5000, done)
    })

    it('connect', function (done) {
      delete grant.config.facebook.oauth
      request.get(url('/connect/facebook'), {
        jar:jar,
        json:true
      }, function (err, res, body) {
        res.headers['x-test'].should.equal('true')
        should.deepEqual(body, {
          error: 'Grant: missing or misconfigured provider'})
        done()
      })
    })
    it('connect - no callback', function (done) {
      delete grant.config.facebook.callback
      request.get(url('/connect/facebook'), {
        jar:jar,
        json:true
      }, function (err, res, body) {
        should.equal(res.headers['x-test'], undefined)
        should.deepEqual(body, {
          error: 'Grant: missing or misconfigured provider'})
        done()
      })
    })

    it('callback', function (done) {
      grant.config.facebook.callback = '/'
      request.get(url('/connect/facebook/callback'), {
        jar:jar,
        json:true
      }, function (err, res, body) {
        res.headers['x-test'].should.equal('true')
        should.deepEqual(body, {
          error: 'Grant: missing session or misconfigured provider'})
        done()
      })
    })
    it('callback - no callback', function (done) {
      delete grant.config.facebook.callback
      request.get(url('/connect/facebook/callback'), {
        jar:jar,
        json:true
      }, function (err, res, body) {
        should.equal(res.headers['x-test'], undefined)
        should.deepEqual(body, {
          error: 'Grant: missing session or misconfigured provider'})
        done()
      })
    })

    after(function (done) {
      server.close(done)
    })
  })
})
