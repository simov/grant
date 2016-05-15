'use strict'

var qs = require('qs')
var request = require('request')
var utils = require('../utils')


exports.step1 = function (provider, done) {
  var url = provider.request_url
  var options = {
    headers: {
      'x-accept': 'application/x-www-form-urlencoded'
    },
    form: {
      consumer_key: provider.key,
      redirect_uri: utils.redirect_uri(provider),
      state: provider.state
    }
  }
  request.post(url, options, function (err, res, body) {
    var error = utils.error(err, res, body)
    done(error, qs.parse(body))
  })
}

exports.step2 = function (provider, step1) {
  var url = provider.authorize_url
  var params = {
    request_token: step1.code,
    redirect_uri: utils.redirect_uri(provider)
  }
  return url + '?' + qs.stringify(params)
}

exports.step3 = function (provider, step1, done) {
  var url = provider.access_url
  var options = {
    headers: {
      'x-accept': 'application/x-www-form-urlencoded'
    },
    form: {
      consumer_key: provider.key,
      code: step1.code
    }
  }
  request.post(url, options, function (err, res, body) {
    var error = utils.error(err, res, body)
    done(error, utils.toQuerystring(provider, body))
  })
}
