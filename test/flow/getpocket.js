'use strict'

var t = require('assert')
var qs = require('qs')
var express = require('express')
var Grant = require('../../').express()
var getpocket = require('../../lib/flow/getpocket')


describe('getpocket', function () {
  function url (path) {
    return 'http://localhost:5000' + path
  }

  var grant, server

  before(function (done) {
    var config = {
      getpocket: {
        request_url: url('/request_url'),
        authorize_url: '/authorize_url',
        access_url: url('/access_url'),
        redirect_uri: '/redirect_uri',
        key: 'key',
        state: '123'
      }
    }
    grant = new Grant(config)
    var app = express().use(grant)

    app.post('/request_url', function (req, res) {
      req.pipe(res)
    })
    app.post('/access_url', function (req, res) {
      res.end(qs.stringify({access_token: 'token', some: 'data'}))
    })
    server = app.listen(5000, done)
  })

  it('step1', function (done) {
    getpocket.step1(grant.config.getpocket, function (err, data) {
      t.deepEqual(data, {
        consumer_key: 'key',
        redirect_uri: '/redirect_uri',
        state: '123'
      })
      done()
    })
  })

  it('step2', function () {
    var url = getpocket.step2(grant.config.getpocket, {code: 'code'})
    t.deepEqual(qs.parse(url.replace('/authorize_url?', '')), {
      request_token: 'code',
      redirect_uri: '/redirect_uri'
    })
  })

  it('step3', function (done) {
    getpocket.step3(grant.config.getpocket, {}, function (err, url) {
      t.deepEqual(qs.parse(url), {
        access_token: 'token',
        raw: {access_token: 'token', some: 'data'}
      })
      done()
    })
  })

  after(function (done) {
    server.close(done)
  })
})
