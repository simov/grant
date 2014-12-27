
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
  if (provider.zendesk) {
    url = url.replace('[subdomain]',provider.subdomain)
  }
  return url
}

exports.step2 = function (provider, step1, done) {
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
  if (provider.reddit) {
    delete options.form.client_id;
    delete options.form.client_secret;
    options.auth = {user:provider.key, pass:provider.secret}
  }
  var url = provider.access_url
  if (provider.zendesk) {
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
  if (provider.zendesk) {
    url = url.replace('[subdomain]',provider.subdomain)
  }
  return url
}
