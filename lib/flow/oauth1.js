
var qs = require('qs')
var request = require('../client')


exports.request = ({request:client}) => async ({provider, input}) => {
  var options = {
    method: 'POST',
    url: provider.request_url,
    oauth: {
      callback: provider.redirect_uri,
      consumer_key: provider.key,
      consumer_secret: provider.secret
    }
  }
  if (provider.private_key) {
    options.oauth.signature_method = 'RSA-SHA1'
    options.oauth.private_key = provider.private_key
    delete options.oauth.consumer_secret
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
  if (provider.twitter) {
    if (provider.scope) {
      options.qs = {x_auth_access_type: [].concat(provider.scope).join()}
    }
    if (provider.custom_params) {
      options.qs = {x_auth_access_type: provider.custom_params.x_auth_access_type}
    }
  }
  if (provider.subdomain) {
    options.url = options.url.replace('[subdomain]', provider.subdomain)
  }
  try {
    var {body:output} = await request({...client, ...options})
    if (provider.sellsy) {
      output = qs.parse(output)
    }
  }
  catch (err) {
    var output = {error: err.body || err.message}
  }
  return {provider, input, output}
}

exports.authorize = async ({provider, input, output}) => {
  if (!output.oauth_token && !output.code) {
    output = Object.keys(output).length
      ? output : {error: 'Grant: OAuth1 missing oauth_token parameter'}
    return {provider, input, output}
  }
  var url = provider.authorize_url
  var params = {
    oauth_token: output.oauth_token
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
      request_token: output.code,
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
  return {provider, input, output: `${url}?${qs.stringify(params)}`}
}

exports.access = ({request:client}) => async ({provider, input, input:{session, query}}) => {
  if (!query.oauth_token && !session.request.code) {
    var output = Object.keys(query).length
      ? query : {error: 'Grant: OAuth1 missing oauth_token parameter'}
    return {provider, input, output}
  }
  var options = {
    method: 'POST',
    url: provider.access_url,
    oauth: {
      consumer_key: provider.key,
      consumer_secret: provider.secret,
      token: query.oauth_token,
      token_secret: session.request.oauth_token_secret,
      verifier: query.oauth_verifier
    }
  }
  if (provider.private_key) {
    options.oauth.signature_method = 'RSA-SHA1'
    options.oauth.private_key = provider.private_key
    delete options.oauth.consumer_secret
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
      code: session.request.code
    }
  }
  if (provider.goodreads || provider.tripit) {
    delete options.oauth.verifier
  }
  if (provider.subdomain) {
    options.url = options.url.replace('[subdomain]', provider.subdomain)
  }
  try {
    var {body:output} = await request({...client, ...options})
  }
  catch (err) {
    var output = {error: err.body || err.message}
  }
  return {provider, input, output}
}
