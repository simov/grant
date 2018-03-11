'use strict'

var qs = require('qs')
var request = require('../client')
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
  request(Object.assign({
    method: 'POST',
    url,
  }, options))
  .then(({res, body}) => {
    done(null, qs.parse(body))
  })
  .catch((err) => {
    done(utils.error(err))
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
  request(Object.assign({
    method: 'POST',
    url,
  }, options))
  .then(({res, body}) => {
    done(null, utils.toQuerystring(provider, body))
  })
  .catch((err) => {
    done(utils.error(err))
  })
}
