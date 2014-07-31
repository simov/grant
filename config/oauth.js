
var dcopy = require('deep-copy');
var oauth = require('./oauth.json')


for (var provider in oauth) {
  // provider shortcuts
  oauth[provider][provider] = true;
  oauth[provider].name = provider;

  oauth[provider].get = function (app, config) {
    var s = dcopy(this);

    // application credentials
    if (s.auth_version == 1) {
      s.consumer_key = app.key;
      s.consumer_secret = app.secret;
    }
    else if (s.auth_version == 2) {
      s.client_id = app.key;
      s.client_secret = app.secret;
    }

    // application options
    s.headers = config.headers||null; // custom headers
    s.redirect = config.redirect||null; // full path callback url
    s.scope = config.scope||null;
    s.callback = config.callback||'';

    // quirks
    if (s.linkedin) {
      // LinkedIn accepts an extended "scope" parameter when obtaining a request.
      // Unfortunately, it wants this as a URL query parameter, rather than encoded
      // in the POST body (which is the more established and supported mechanism of
      // extending OAuth).
      s.request_url += '?scope='+s.scope;
    }

    return s;
  }
}

exports = module.exports = oauth;
