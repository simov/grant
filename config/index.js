
var dcopy = require('deep-copy');


// heroku|dropbox: set config/server.js protocol to https
// dropbox: npm install git://github.com/simov/mashape-oauth.js.git#oauth2-type


exports = module.exports = function (config) {
  // application server configuration
  config.server = config.server||{};
  // oauth application credentials
  config.credentials = config.credentials||{};
  // oauth application options
  config.options = config.options||{};
  // oauth application options
  config.oauth = require('./oauth.json');
  // generated below
  config.app = null;

  var providers = {};


  // generate oauth params
  for (var key in config.oauth) {
    // oauth provider settings
    var provider = dcopy(config.oauth[key]);

    // provider shortcuts
    provider[key] = true;
    provider.name = key;

    // oauth application credentials
    var app = config.credentials[key]||{};
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
    var server = config.server;
    // oauth application options
    var options = config.options[key]||{};

    // final callback
    provider.callback = options.callback||server.callback;

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

  config.app = providers;
  return config;
}
