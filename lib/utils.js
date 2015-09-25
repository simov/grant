'use strict'

var qs = require('qs')


exports.redirect_uri = function (provider) {
  if (provider.redirect_uri) {
    return provider.redirect_uri
  }
  var url = [
    provider.protocol,
    '://',
    provider.host,
    '/connect/',
    provider.name,
    '/callback'
  ].join('')
  return url
}

exports.toQuerystring = function (provider, body, err) {
  var data
  try {data = JSON.parse(body)} catch (e) {}
  data = data || qs.parse(body)

  var result = {}
  if (provider.concur) {
    result.access_token = body.replace(
      /[\s\S]+<Token>([^<]+)<\/Token>[\s\S]+/, '$1')
    result.refresh_token = body.replace(
      /[\s\S]+<Refresh_Token>([^<]+)<\/Refresh_Token>[\s\S]+/, '$1')
    data = body
  }
  else if (provider.elance) {
    result.access_token = data.data.access_token
    result.refresh_token = data.data.refresh_token
  }
  else if (provider.getpocket) {
    result.access_token = data.access_token
  }
  else if (provider.yammer) {
    result.access_token = data.access_token.token
  }
  else if (provider.oauth == 1) {
    for (var key in data) {
      if (key == 'oauth_token') {
        result.access_token = data.oauth_token
      }
      else if (key == 'oauth_token_secret') {
        result.access_secret = data.oauth_token_secret
      }
    }
  }
  else if (provider.oauth == 2) {
    for (var key in data) {
      if (key == 'access_token') {
        result.access_token = data.access_token
      }
      else if (key == 'refresh_token') {
        result.refresh_token = data.refresh_token
      }
    }
  }

  result[err ? 'error' : 'raw'] = data
  return qs.stringify(result)
}

exports.error = function (err, res, body) {
  if (err) {
    return this.toQuerystring({}, {error:err.message}, true)
  }
  if (res.statusCode < 200 || res.statusCode > 299) {
    return this.toQuerystring({}, body, true)
  }
}
