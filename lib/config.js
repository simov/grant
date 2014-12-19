
var dcopy = require('deep-copy');


// oauth scope transform
exports.scope = function (provider, options) {
  var scope = options.scope||provider.scope;

  provider.scope = (scope instanceof Array)
    ? scope.join(provider.scope_delimiter||',')
    : scope;

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

    // oauth state
    provider.state = options.state;

    // custom
    if (provider.google) {
      provider.access_type = options.access_type;
    }
    if (provider.reddit) {
      provider.duration = options.duration;
    }
    if (provider.trello) {
      provider.expiration = options.expiration;
    }

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
