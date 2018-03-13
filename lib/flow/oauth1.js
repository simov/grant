'use strict'

var qs = require('qs')
var request = require('../client')
var utils = require('../utils')


exports.request = function (provider, done) {
  var url = provider.request_url
  var options = {
    oauth: {
      callback: utils.redirect_uri(provider),
      consumer_key: provider.key,
      consumer_secret: provider.secret
    }
  }
  if (provider.copy || provider.etsy || provider.linkedin) {
    options.qs = {scope: provider.scope}
  }
  if (provider.getpocket) {
    options = {
      headers: {
        'x-accept': 'application/x-www-form-urlencoded'
      },
      form: {
        consumer_key: provider.key,
        redirect_uri: utils.redirect_uri(provider),
        state: provider.state
      }
    }
  }
  if (provider.discogs) {
    options.headers = {'user-agent': 'Grant'}
  }
  if (provider.freshbooks) {
    options.oauth.signature_method = 'PLAINTEXT'
  }
  if (provider.subdomain) {
    url = url.replace('[subdomain]', provider.subdomain)
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

exports.authorize = function (provider, req) {
  if (!req.oauth_token && !req.code) {
    var error = (Object.keys(req).length)
      ? req : {error: 'Grant: OAuth1 missing oauth_token parameter'}
    return utils.toQuerystring({}, error, true)
  }
  var url = provider.authorize_url
  var params = {
    oauth_token: req.oauth_token
  }
  if (provider.custom_params) {
    for (var key in provider.custom_params) {
      params[key] = provider.custom_params[key]
    }
  }
  if (provider.flickr) {
    params.perms = provider.scope
  }
  if (provider.getpocket) {
    params = {
      request_token: req.code,
      redirect_uri: utils.redirect_uri(provider)
    }
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

exports.access = function (provider, req, authorize, done) {
  if (!authorize.oauth_token && !req.code) {
    var error = (Object.keys(authorize).length)
      ? authorize : {error: 'Grant: OAuth1 missing oauth_token parameter'}
    done(utils.toQuerystring({}, error, true))
    return
  }
  var url = provider.access_url
  var options = {
    oauth: {
      consumer_key: provider.key,
      consumer_secret: provider.secret,
      token: authorize.oauth_token,
      token_secret: req.oauth_token_secret,
      verifier: authorize.oauth_verifier
    }
  }
  if (provider.discogs) {
    options.headers = {'user-agent': 'Grant'}
  }
  if (provider.freshbooks) {
    options.oauth.signature_method = 'PLAINTEXT'
  }
  if (provider.getpocket) {
    options = {
      headers: {
        'x-accept': 'application/x-www-form-urlencoded'
      },
      form: {
        consumer_key: provider.key,
        code: req.code
      }
    }
  }
  if (provider.goodreads || provider.tripit) {
    delete options.oauth.verifier
  }
  if (provider.subdomain) {
    url = url.replace('[subdomain]', provider.subdomain)
  }
  request(Object.assign({
    method: 'POST',
    url,
  }, options))
    .then(({res, body}) => {
      if (provider.intuit) {
        body += '&realmId=' + authorize.realmId
      }
      done(null, body)
    })
    .catch((err) => {
      done(utils.error(err))
    })
}

exports.callback = function (provider, access) {
  return utils.toQuerystring(provider, access)
}
