'use strict'

var qs = require('qs')
  , request = require('request')
var utils = require('../utils')


exports.step1 = function (provider) {
  var url = provider.authorize_url
  var params = {
    client_id:provider.key,
    response_type:'code',
    redirect_uri:utils.redirect_uri(provider),
    scope:provider.scope,
    state:provider.state
  }
  if (provider.basecamp) {
    params.type = 'web_server'
  }
  if (provider.surveymonkey) {
    params.api_key = provider.api_key
  }
  if (provider.custom_parameters) {
    if (Array.isArray(provider.custom_parameters)) {
      provider.custom_parameters.forEach(function (key) {
        params[key] = provider[key]
      })
    } else if (typeof provider.custom_parameters === 'object') {
      for (var key in provider.custom_parameters) {
        params[key] = provider.custom_parameters[key]
      }
    }
  }
  if (provider.subdomain) {
    url = url.replace('[subdomain]',provider.subdomain)
  }
  return url + '?' + qs.stringify(params)
}

exports.step2 = function (provider, step1, session, done) {
  if (!step1.code) {
    var error = (Object.keys(step1).length) ? step1 : {error:'Grant: authorize_url'}
    return done(utils.toQuerystring({}, error, true))
  }
  if ((step1.state && session.state) && (step1.state !== session.state)) {
    var error = {error:'Grant: OAuth2 state mismatch'}
    return done(utils.toQuerystring({}, error, true))
  }
  var url = provider.access_url
  var options = {
    form:{
      grant_type:'authorization_code',
      code:step1.code,
      client_id:provider.key,
      client_secret:provider.secret,
      redirect_uri:utils.redirect_uri(provider)
    }
  }
  if (provider.basecamp) {
    options.form.type = 'web_server'
  }
  if (provider.surveymonkey) {
    options.qs = {api_key:provider.api_key}
  }
  if (provider.reddit) {
    delete options.form.client_id
    delete options.form.client_secret
    options.auth = {user:provider.key, pass:provider.secret}
  }
  if (provider.subdomain) {
    url = url.replace('[subdomain]',provider.subdomain)
  }
  request.post(url, options, function (err, res, body) {
    var err = utils.error(err, res, body)
    if (err) return done(err)
    done(null, body)
  })
}

exports.step3 = function (provider, step2) {
  return utils.toQuerystring(provider, step2)
}
