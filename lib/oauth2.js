
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
  if (provider.google) {
    params.access_type = provider.access_type;
  }
  if (provider.reddit) {
    params.duration = provider.duration;
  }
  var url = provider.authorize_url + '?' + qs.stringify(params)
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
  if (provider.reddit) {
    delete options.form.client_id;
    delete options.form.client_secret;
    options.auth = {user:provider.key, pass:provider.secret}
  }
  request.post(provider.access_url, options, function (err, _res, body) {
    // TODO: handle error
    if (err) console.log(err)
    done(null, body)
  })
}

exports.step3 = function (provider, step2) {
  var url = provider.callback + '?' + utils.toQuerystring(provider, step2)
  return url
}
