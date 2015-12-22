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
    url = url.replace('[subdomain]', provider.subdomain)
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
    var error = (Object.keys(step1).length)
      ? step1 : {error:'Grant: OAuth1 missing oauth_token parameter'}
    return provider.callback + '?' + utils.toQuerystring({}, error, true)
  }
  var url = provider.authorize_url
  var params = {
    oauth_token:step1.oauth_token
  }
  if (provider.custom_params) {
    for (var key in provider.custom_params) {
      params[key] = provider.custom_params[key]
    }
  }
  if (provider.flickr) {
    params.perms = provider.scope
  }
  if (provider.ravelry || provider.trello) {
    params.scope = provider.scope
  }
  if (provider.tripit) {
    params.oauth_callback = utils.redirect_uri(provider)
  }
  if (provider.subdomain) {
    url = url.replace('[subdomain]', provider.subdomain)
  }
  return url + '?' + qs.stringify(params)
}

exports.step3 = function (provider, step1, step2, done) {
  if (!step2.oauth_token) {
    var error = (Object.keys(step2).length)
      ? step2 : {error:'Grant: OAuth1 missing oauth_token parameter'}
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
    url = url.replace('[subdomain]', provider.subdomain)
  }
  request.post(url, options, function (err, res, body) {
    var err = utils.error(err, res, body)
    if (err) return done(err)
    if (provider.intuit) {
      body += '&realmId=' + step2.realmId
    }
    done(null, utils.toQuerystring(provider, body))
  })
}
