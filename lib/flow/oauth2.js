'use strict'

var crypto = require('crypto')
var qs = require('qs')
var request = require('../client')
var utils = require('../utils')


exports.authorize = (provider) => {
  var url = provider.authorize_url
  var params = {
    client_id: provider.key,
    response_type: 'code',
    redirect_uri: utils.redirect_uri(provider),
    scope: provider.scope,
    state: provider.state
  }
  if (provider.custom_params) {
    for (var key in provider.custom_params) {
      params[key] = provider.custom_params[key]
    }
  }
  if (provider.basecamp) {
    params.type = 'web_server'
  }
  if (provider.optimizely) {
    params.scopes = params.scope
    delete params.scope
  }
  if (provider.visualstudio) {
    params.response_type = 'Assertion'
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
  return url + '?' + querystring
}

exports.access = (provider, authorize, session, done) => {
  if (!authorize.code) {
    var error = (Object.keys(authorize).length)
      ? authorize : {error: 'Grant: OAuth2 missing code parameter'}
    done(utils.toQuerystring({}, error, true))
    return
  }
  else if ((authorize.state && session.state) && (authorize.state !== session.state)) {
    var error = {error: 'Grant: OAuth2 state mismatch'}
    done(utils.toQuerystring({}, error, true))
    return
  }
  var url = provider.access_url
  var options = {
    form: {
      grant_type: 'authorization_code',
      code: authorize.code,
      client_id: provider.key,
      client_secret: provider.secret,
      redirect_uri: utils.redirect_uri(provider)
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
  if (provider.ebay || provider.fitbit2 || provider.homeaway || provider.reddit) {
    delete options.form.client_id
    delete options.form.client_secret
    options.auth = {user: provider.key, pass: provider.secret}
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
      redirect_uri: utils.redirect_uri(provider)
    }
  }
  if (provider.subdomain) {
    url = url.replace('[subdomain]', provider.subdomain)
  }
  request(Object.assign({
    method: 'POST',
    url,
  }, options))
    .then(({res, body}) => {
      done(null, body)
    })
    .catch((err) => {
      done(utils.error(err))
    })
}

exports.callback = (provider, access) => {
  return utils.toQuerystring(provider, access)
}
