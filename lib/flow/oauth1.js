
var qs = require('qs')
var request = require('../client')
var response = require('../response')


exports.request = (provider) => new Promise((resolve, reject) => {
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
  if (provider.discogs) {
    options.headers = {'user-agent': 'Grant'}
  }
  if (provider.freshbooks) {
    options.oauth.signature_method = 'PLAINTEXT'
  }
  if (provider.subdomain) {
    options.url = options.url.replace('[subdomain]', provider.subdomain)
  }
  request(options)
    .then(resolve)
    .catch((err) => reject({error: err.body || err.message}))
})

exports.authorize = (provider, req) => new Promise((resolve, reject) => {
  if (!req.oauth_token && !req.code) {
    reject(Object.keys(req).length ? {error: req}
      : {error: {error: 'Grant: OAuth1 missing oauth_token parameter'}})
    return
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
  resolve(`${url}?${qs.stringify(params)}`)
})

exports.access = (provider, req, authorize) => new Promise((resolve, reject) => {
  if (!authorize.oauth_token && !req.code) {
    reject(Object.keys(authorize).length ? {error: authorize}
      : {error: 'Grant: OAuth1 missing oauth_token parameter'})
    return
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
  if (provider.discogs) {
    options.headers = {'user-agent': 'Grant'}
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
  request(options)
    .then(({body}) => {
      if (provider.intuit) {
        body.realmId = authorize.realmId
      }
      resolve(response(provider, body))
    })
    .catch((err) => reject({error: err.body || err.message}))
})
