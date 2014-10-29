
var dcopy = require('deep-copy');


// auuth application credentials transform
exports.credentials = function (provider, options) {
  if (provider.auth_version == 1) {
    provider.consumer_key = options.key||provider.key;
    provider.consumer_secret = options.secret||provider.secret;
  }
  else if (provider.auth_version == 2) {
    provider.client_id = options.key||provider.key;
    provider.client_secret = options.secret||provider.secret;
  }
}

// oauth scope transform
exports.scope = function (provider, options) {
  if (options.scope instanceof Array) {
    if (provider.google) {
      // Google sets the offline access outside of the regular scopes
      var idx = options.scope.indexOf('offline');
      if (idx != -1) {
        options.scope.splice(idx,1);
        provider.access_type = 'offline';
      } else {
        delete provider.access_type;
      }
    }
    provider.scope = options.scope.join(provider.scope_delimiter||',');
  }
  else {
    provider.scope = options.scope;
  }

  if (provider.linkedin) {
    // LinkedIn accepts an extended "scope" parameter when obtaining a request.
    // Unfortunately, it wants this as a URL query parameter, rather than encoded
    // in the POST body (which is the more established and supported mechanism of
    // extending OAuth).
    provider.request_url = provider.request_url.replace(/(.*)\?scope=.*/,'$1');
    provider.request_url += '?scope='+provider.scope;
  }
}

exports.transform = function (provider, options) {
  this.credentials(provider, options);
  this.scope(provider, options);
}

exports.override = function (provider, options) {
  var override = dcopy(provider);
  for (var key in options) {
    override[key] = options[key];
  }
  return override;
}

exports.init = function (config) {
  config = config||{};
  // oauth configuration
  config.oauth = require('./oauth.json');
  // generated below
  config.app = {};


  // generate provider options
  for (var key in config.oauth) {
    // oauth provider settings
    var provider = dcopy(config.oauth[key]);
    // oauth application options
    var options = config[key]||{};

    // provider shortcuts
    provider[key] = true;
    provider.name = key;
    provider.key = options.key;
    provider.secret = options.secret;

    // server options
    provider.protocol = options.protocol||config.server.protocol;
    provider.host = options.host||config.server.host;
    provider.callback = options.callback||config.server.callback;

    // headers
    provider.headers = {'User-Agent': 'Grant'};
    // oauth state
    provider.state = options.state;

    // overrides
    var overrides = {};
    for (var key in options) {
      if (key != 'scope' && 'object'===typeof options[key]) {
        overrides[key] = this.override(provider, options[key]);
        this.transform(overrides[key], options[key]);
      }
    }
    this.transform(provider, options);
    provider.overrides = overrides;

    config.app[provider.name] = provider;
  }

  return config;
}
