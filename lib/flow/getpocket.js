'use strict'

var qs = require('qs')
  , request = require('request')
var utils = require('../utils')


exports.step1 = function (provider, done) {
  request.post(provider.request_url, {
    headers: {
      // 'x-accept':'application/json'
      'x-accept':'application/x-www-form-urlencoded'
    },
    form: {
      consumer_key:provider.key,
      redirect_uri:utils.redirect_uri(provider),
      state:provider.state
    }
  }, function (err, res, body) {
    var err = utils.error(err, res, body)
    if (err) return done(err)
    var data = qs.parse(body)
    done(null, data)
  })
}

exports.step2 = function (provider, step1) {
  var params = {
    request_token:step1.code,
    redirect_uri:utils.redirect_uri(provider)
  }
  var url = provider.authorize_url + '?' + qs.stringify(params)
  return url
}

exports.step3 = function (provider, step1, done) {
  request.post(provider.access_url, {
    headers: {
      // 'x-accept':'application/json'
      'x-accept':'application/x-www-form-urlencoded'
    },
    form: {
      consumer_key:provider.key,
      code:step1.code
    }
  }, function (err, res, body) {
    var err = utils.error(err, res, body)
    if (err) return done(err)
    return done(null, utils.toQuerystring(provider, body))
  })
}
