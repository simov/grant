
var qs = require('qs')
var request = require('../client')
var response = require('../response')


exports.request = async (provider) => {
  var options = {
    method: 'POST',
    url: provider.request_url,
    oauth: {
      callback: provider.redirect_uri,
      consumer_key: provider.key,
      consumer_secret: provider.secret
    }
  }
  if (provider.etsy || provider.linkedin) {
    options.qs = {scope: provider.scope}
  }
  if (provider.getpocket) {
    delete options.oauth
    options.headers = {
      'x-accept': 'application/x-www-form-urlencoded'
    }
    options.form = {
      consumer_key: provider.key,
      redirect_uri: provider.redirect_uri,
      state: provider.state
    }
  }
  if (provider.freshbooks) {
    options.oauth.signature_method = 'PLAINTEXT'
  }
  if (provider.subdomain) {
    options.url = options.url.replace('[subdomain]', provider.subdomain)
  }
  try {
    var result = await request(options)
    return result
  }
  catch (err) {
    return {error: err.body || err.message}
  }
}

exports.authorize = async (provider, req) => {
  if (!req.oauth_token && !req.code) {
    throw Object.keys(req).length ? req
      : {error: 'Grant: OAuth1 missing oauth_token parameter'}
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
  if (provider.flickr && provider.scope) {
    params.perms = provider.scope
  }
  if (provider.getpocket) {
    params = {
      request_token: req.code,
      redirect_uri: provider.redirect_uri
    }
  }
  if (provider.ravelry || provider.trello) {
    params.scope = provider.scope
  }
  if (provider.tripit) {
    params.oauth_callback = provider.redirect_uri
  }
  if (provider.subdomain) {
    url = url.replace('[subdomain]', provider.subdomain)
  }
  return `${url}?${qs.stringify(params)}`
}

exports.access = async (provider, req, authorize) => {
  if (!authorize.oauth_token && !req.code) {
    throw Object.keys(authorize).length ? authorize
      : {error: 'Grant: OAuth1 missing oauth_token parameter'}
  }
  var options = {
    method: 'POST',
    url: provider.access_url,
    oauth: {
      consumer_key: provider.key,
      consumer_secret: provider.secret,
      token: authorize.oauth_token,
      token_secret: req.oauth_token_secret,
      verifier: authorize.oauth_verifier
    }
  }
  if (provider.freshbooks) {
    options.oauth.signature_method = 'PLAINTEXT'
  }
  if (provider.getpocket) {
    delete options.oauth
    options.headers = {
      'x-accept': 'application/x-www-form-urlencoded'
    }
    options.form = {
      consumer_key: provider.key,
      code: req.code
    }
  }
  if (provider.goodreads || provider.tripit) {
    delete options.oauth.verifier
  }
  if (provider.subdomain) {
    options.url = options.url.replace('[subdomain]', provider.subdomain)
  }
  try {
    var {body} = await request(options)
    if (provider.intuit) {
      body.realmId = authorize.realmId
    }
    return response(provider, body)
  }
  catch (err) {
    return {error: err.body || err.message}
  }
}
