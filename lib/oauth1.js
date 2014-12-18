
var qs = require('qs')
var request = require('request')
var utils = require('./utils')


exports.step1 = function (provider, done) {
  request.post(provider.request_url, {
    oauth:{
      callback:utils.redirect_uri(provider),
      consumer_key:provider.key,
      consumer_secret:provider.secret
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
    oauth_token:step1.oauth_token
  }
  if (provider.flickr) {
    params.perms = provider.scope
  }
  if (provider.trello) {
    params.scope = provider.scope
    params.expiration = provider.expiration
  }

  var url = provider.authorize_url + '?' + qs.stringify(params)
  return url
}

exports.step3 = function (provider, step1, step2, done) {
  var options = {
    oauth:{
      consumer_key:provider.key,
      consumer_secret:provider.secret,
      token:step2.oauth_token,
      token_secret:step1.oauth_token_secret,
      verifier:step2.oauth_verifier
    }
  }
  if (provider.goodreads) {
    delete options.oauth.verifier
  }
  request.post(provider.access_url, options, function (err, res, body) {
    var err = utils.error(err, res, body)
    if (err) return done(err)
    var url = provider.callback + '?' + utils.toQuerystring(provider, body)
    return done(null, url)
  })
}
