
var qs = require('qs')
var request = require('request')
var utils = require('./utils')


exports.step1 = function (provider) {
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
  if (provider.google) {
    params.access_type = provider.access_type;
  }
  if (provider.reddit) {
    params.duration = provider.duration;
  }
  var url = provider.authorize_url + '?' + qs.stringify(params)
  if (provider.shopify || provider.zendesk) {
    url = url.replace('[subdomain]',provider.subdomain)
  }
  return url
}

exports.step2 = function (provider, step1, session, done) {
  if (!step1.code) {
    return done(utils.toQuerystring({}, step1, true))
  }
  if (step1.state !== session.state) {
    return done(utils.toQuerystring({}, {error:'OAuth2 state mismatch'}, true))
  }
  var url = provider.access_url
  var options = {
    form:{
      client_id:provider.key,
      client_secret:provider.secret,
      code:step1.code,
      redirect_uri:utils.redirect_uri(provider),
      grant_type:'authorization_code'
    }
  }
  if (provider.basecamp) {
    options.form.type = 'web_server'
  }
  if (provider.assembla || provider.reddit) {
    delete options.form.client_id;
    delete options.form.client_secret;
    options.auth = {user:provider.key, pass:provider.secret}
  }
  if (provider.shopify || provider.zendesk) {
    url = url.replace('[subdomain]',provider.subdomain)
  }
  request.post(url, options, function (err, res, body) {
    var err = utils.error(err, res, body)
    if (err) return done(err)
    done(null, body)
  })
}

exports.step3 = function (provider, step2) {
  var url = provider.callback + '?' + utils.toQuerystring(provider, step2)
  return url
}
