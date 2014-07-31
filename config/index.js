
var dcopy = require('deep-copy');


var json = {
  // application server configuration
  server: require('./server.json'),
  // oauth application credentials
  credentials: require('./credentials.json'),
  // oauth application options
  options: require('./options.json'),
  // oauth provider settings
  oauth: require('./oauth.json'),
  // generated below
  app: null
};

// heroku|dropbox: set config/server.js protocol to https
// dropbox: npm install git://github.com/simov/mashape-oauth.js.git#oauth2-type


var providers = {};


// generate oauth params
for (var key in json.oauth) {
  // oauth provider settings
  var provider = dcopy(json.oauth[key]);

  // provider shortcuts
  provider[key] = true;
  provider.name = key;

  // oauth application credentials
  var app = json.credentials[key]||{};
  // application credentials
  if (provider.auth_version == 1) {
    provider.consumer_key = app.key;
    provider.consumer_secret = app.secret;
  }
  else if (provider.auth_version == 2) {
    provider.client_id = app.key;
    provider.client_secret = app.secret;
  }

  // application server configuration
  var server = json.server;
  // oauth application options
  var options = json.options[key]||{};

  // full path callback match
  provider.redirect = (options.redirect)
    ? server.hostname + options.redirect
    : null;
  // oauth callback
  provider.callback = server.callback||'';

  // oauth scope
  if (options.scope instanceof Array) {
    provider.scope = (provider.google)
      ? options.scope.join(' ')
      : options.scope.join();
  }
  else {
    provider.scope = options.scope||null;
  }

  // custom headers
  provider.headers = options.headers||null;

  // quirks
  if (provider.linkedin) {
    // LinkedIn accepts an extended "scope" parameter when obtaining a request.
    // Unfortunately, it wants this as a URL query parameter, rather than encoded
    // in the POST body (which is the more established and supported mechanism of
    // extending OAuth).
    provider.request_url += '?scope='+provider.scope;
  }

  providers[provider.name] = provider;
}

json.app = providers;


exports = module.exports = json;
