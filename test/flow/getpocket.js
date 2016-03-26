'use strict'

var t = require('assert')
var qs = require('qs')
var express = require('express')
var Grant = require('../../').express()
var getpocket = require('../../lib/flow/getpocket')


describe('getpocket', function () {
  function url (path) {
    var c = config.server
    return c.protocol + '://' + c.host + path
  }

  var grant, app, server
  var config = {
    server: {protocol: 'http', host: 'localhost:5000', callback: '/'},
    getpocket: {}
  }

  before(function (done) {
    grant = new Grant(config)
    app = express().use(grant)

    grant.config.getpocket.request_url = url('/request_url')
    grant.config.getpocket.authorize_url = '/authorize_url'
    grant.config.getpocket.access_url = url('/access_url')

    app.post('/request_url', function (req, res) {
      res.end(qs.stringify({some: 'data'}))
    })
    app.post('/access_url', function (req, res) {
      res.end(JSON.stringify({some: 'data'}))
    })
    server = app.listen(5000, done)
  })

  it('step1', function (done) {
    getpocket.step1(grant.config.getpocket, function (err, data) {
      t.deepEqual(data, {some: 'data'})
      done()
    })
  })

  it('step2', function () {
    var url = getpocket.step2(grant.config.getpocket, {code: 'code'})
    t.equal(url, '/authorize_url?request_token=code' +
      '&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fconnect%2Fgetpocket%2Fcallback')
  })

  it('step3', function (done) {
    getpocket.step3(grant.config.getpocket, {}, function (err, url) {
      t.equal(url, 'raw%5Bsome%5D=data')
      done()
    })
  })

  after(function (done) {
    server.close(done)
  })
})
