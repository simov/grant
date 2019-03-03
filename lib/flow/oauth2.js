
var crypto = require('crypto')
var qs = require('qs')
var request = require('../client')
var response = require('../response')


exports.authorize = (provider) => new Promise((resolve) => {
  var url = provider.authorize_url
  var params = {
    client_id: provider.key,
    response_type: 'code',
    redirect_uri: provider.redirect_uri,
    scope: provider.scope,
    state: provider.state,
    nonce: provider.nonce
  }
  if (provider.custom_params) {
    for (var key in provider.custom_params) {
      params[key] = provider.custom_params[key]
    }
  }
  if (provider.basecamp) {
    params.type = 'web_server'
  }
  if (provider.freelancer && params.scope) {
    params.advanced_scopes = params.scope
    delete params.scope
  }
  if (provider.optimizely && params.scope) {
    params.scopes = params.scope
    delete params.scope
  }
  if (provider.visualstudio) {
    params.response_type = 'Assertion'
  }
  if (provider.wechat) {
    params.appid = params.client_id
    delete params.client_id
  }
  if (provider.subdomain) {
    url = url.replace('[subdomain]', provider.subdomain)
  }
  var querystring = qs.stringify(params)
  if (provider.unsplash && params.scope) {
    var scope = params.scope
    delete params.scope
    querystring = qs.stringify(params) + '&scope=' + scope
  }
  resolve(`${url}?${querystring}`)
})

exports.access = (provider, authorize, session) => new Promise((resolve, reject) => {
  if (!authorize.code) {
    reject(Object.keys(authorize).length ? {error: authorize}
      : {error: {error: 'Grant: OAuth2 missing code parameter'}})
    return
  }
  else if ((authorize.state && session.state) && (authorize.state !== session.state)) {
    reject({error: {error: 'Grant: OAuth2 state mismatch'}})
    return
  }
  var options = {
    method: 'POST',
    url: provider.access_url,
    form: {
      grant_type: 'authorization_code',
      code: authorize.code,
      client_id: provider.key,
      client_secret: provider.secret,
      redirect_uri: provider.redirect_uri
    }
  }
  if (provider.basecamp) {
    options.form.type = 'web_server'
  }
  if (provider.concur) {
    delete options.form
    options.qs = {
      code: authorize.code,
      client_id: provider.key,
      client_secret: provider.secret
    }
  }
  if (/ebay|fitbit2|homeaway|hootsuite|reddit/.test(provider.name)
    || provider.token_endpoint_auth_method === 'client_secret_basic'
  ) {
    delete options.form.client_id
    delete options.form.client_secret
    options.auth = {user: provider.key, pass: provider.secret}
  }
  if (provider.qq) {
    options.method = 'GET'
    options.qs = options.form
    delete options.form
  }
  if (provider.wechat) {
    options.method = 'GET'
    options.qs = options.form
    delete options.form
    options.qs.appid = options.qs.client_id
    options.qs.secret = options.qs.client_secret
    delete options.qs.client_id
    delete options.qs.client_secret
  }
  if (provider.smartsheet) {
    delete options.form.client_secret
    var hash = crypto.createHash('sha256')
    hash.update(provider.secret + '|' + authorize.code)
    options.form.hash = hash.digest('hex')
  }
  if (provider.surveymonkey) {
    options.qs = {api_key: provider.custom_params.api_key}
  }
  if (provider.visualstudio) {
    options.form = {
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: provider.secret,
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: authorize.code,
      redirect_uri: provider.redirect_uri
    }
  }
  if (provider.subdomain) {
    options.url = options.url.replace('[subdomain]', provider.subdomain)
  }
  request(options)
    .then(({body}) => resolve(response(provider, body, session)))
    .catch((err) => reject({error: err.body || err.message}))
})
