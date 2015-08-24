'use strict'

var qs = require('qs')
  , request = require('request')
var utils = require('../utils')


exports.step1 = function (provider, done) {
  var url = provider.request_url
  var options = {
    oauth:{
      callback:utils.redirect_uri(provider),
      consumer_key:provider.key,
      consumer_secret:provider.secret
    }
  }
  if (provider.copy || provider.etsy || provider.linkedin) {
    options.qs = {scope:provider.scope}
  }
  if (provider.freshbooks) {
    options.oauth.signature_method = 'PLAINTEXT'
  }
  if (provider.subdomain) {
    url = url.replace('[subdomain]',provider.subdomain)
  }
  request.post(url, options, function (err, res, body) {
    var err = utils.error(err, res, body)
    if (err) return done(err)
    var data = qs.parse(body)
    done(null, data)
  })
}

exports.step2 = function (provider, step1) {
  if (!step1.oauth_token) {
    var error = (Object.keys(step1).length) ? step1 : {error:'Grant: request_url'}
    return provider.callback + '?' + utils.toQuerystring({}, error, true)
  }
  var url = provider.authorize_url
  var params = {
    oauth_token:step1.oauth_token
  }
  if (provider.custom_parameters) {
    if (Array.isArray(provider.custom_parameters)) {
      provider.custom_parameters.forEach(function (key) {
        params[key] = (provider.flickr && key == 'perms')
          ? provider.scope
          : provider[key]
      })
    } else if (typeof provider.custom_parameters === 'object') {
      for (var key in provider.custom_parameters) {
        params[key] = provider.custom_parameters[key]
      }
    }
  }
  if (provider.tripit) {
    params.oauth_callback = utils.redirect_uri(provider)
  }
  if (provider.subdomain) {
    url = url.replace('[subdomain]',provider.subdomain)
  }
  return url + '?' + qs.stringify(params)
}

exports.step3 = function (provider, step1, step2, done) {
  if (!step2.oauth_token) {
    var error = (Object.keys(step2).length) ? step2 : {error:'Grant: authorize_url'}
    return done(utils.toQuerystring({}, error, true))
  }
  var url = provider.access_url
  var options = {
    oauth:{
      consumer_key:provider.key,
      consumer_secret:provider.secret,
      token:step2.oauth_token,
      token_secret:step1.oauth_token_secret,
      verifier:step2.oauth_verifier
    }
  }
  if (provider.freshbooks) {
    options.oauth.signature_method = 'PLAINTEXT'
  }
  if (provider.goodreads || provider.tripit) {
    delete options.oauth.verifier
  }
  if (provider.subdomain) {
    url = url.replace('[subdomain]',provider.subdomain)
  }
  request.post(url, options, function (err, res, body) {
    var err = utils.error(err, res, body)
    if (err) return done(err)
    done(null, utils.toQuerystring(provider, body))
  })
}
