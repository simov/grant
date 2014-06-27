
var dcopy = require('deep-copy');


var settings = {
  facebook: {
    // auth
    base_url: 'https://graph.facebook.com/',
    access_url: 'oauth/access_token',
    request_url: 'oauth/request_url',
    authorize_url: 'https://www.facebook.com/dialog/oauth',
    access_name: 'access_token',

    // guardian
    auth_type: 'oauth',
    auth_version: 2,
    auth_leg: 3
  },
  linkedin: {
    // auth
    base_url: 'https://api.linkedin.com/',
    access_url: 'https://api.linkedin.com/uas/oauth/accessToken',
    request_url: 'https://api.linkedin.com/uas/oauth/requestToken',
    authorize_url: 'https://www.linkedin.com/uas/oauth/authenticate',
    access_name: 'access_token',

    // guardian
    auth_type: 'oauth',
    auth_version: 1,
    auth_leg: 3
  },
  twitter: {
    // auth
    base_url: 'https://api.twitter.com/',
    access_url: 'https://api.twitter.com/oauth/access_token',
    request_url: 'https://api.twitter.com/oauth/request_token',
    authorize_url: 'https://api.twitter.com/oauth/authenticate',
    access_name: 'access_token',
    
    // guardian
    auth_type: 'oauth',
    auth_version: 1,
    auth_leg: 3
  },
  stocktwits: {
    // auth
    base_url: 'https://api.stocktwits.com/',
    access_url: 'https://api.stocktwits.com/api/2/oauth/token',
    authorize_url: 'https://api.stocktwits.com/api/2/oauth/authorize',
    access_name: 'access_token',
    grant_type: 'authorization_code',
    
    // guardian
    auth_type: 'oauth',
    auth_version: 2,
    auth_leg: 3
  },
  soundcloud: {
    // auth
    base_url: 'https://api.soundcloud.com/',
    access_url: 'https://api.soundcloud.com/oauth2/token',
    authorize_url: 'https://soundcloud.com/connect',
    access_name: 'access_token',
    
    // guardian
    auth_type: 'oauth',
    auth_version: 2,
    auth_leg: 3
  },
  bitly: {
    // auth
    base_url: 'https://api-ssl.bitly.com/',
    access_url: 'https://api-ssl.bitly.com/oauth/access_token',
    authorize_url: 'https://bitly.com/oauth/authorize',
    access_name: 'access_token',
    grant_type: 'authorization_code',
    
    // guardian
    auth_type: 'oauth',
    auth_version: 2,
    auth_leg: 3
  },
  github: {
    // auth
    base_url: 'https://github.com/',
    access_url: 'https://github.com/login/oauth/access_token',
    authorize_url: 'https://github.com/login/oauth/authorize',
    access_name: 'access_token',
    
    // guardian
    auth_type: 'oauth',
    auth_version: 2,
    auth_leg: 3
  },
  stackexchange: {
    // auth
    base_url: 'https://stackexchange.com/',
    access_url: 'https://stackexchange.com/oauth/access_token',
    authorize_url: 'https://stackexchange.com/oauth',
    access_name: 'access_token',
    
    // guardian
    auth_type: 'oauth',
    auth_version: 2,
    auth_leg: 3
  },
  google: {
    // auth
    base_url: 'https://accounts.google.com/',
    access_url: 'https://accounts.google.com/o/oauth2/token',
    authorize_url: 'https://accounts.google.com/o/oauth2/auth',
    access_name: 'access_token',
    
    // guardian
    auth_type: 'oauth',
    auth_version: 2,
    auth_leg: 3
  },
  yahoo: {
    // auth
    base_url: 'https://accounts.yahoo.com/',
    access_url: 'https://api.login.yahoo.com/oauth/v2/get_token',
    request_url: 'https://api.login.yahoo.com/oauth/v2/get_request_token',
    authorize_url: 'https://api.login.yahoo.com/oauth/v2/request_auth',
    access_name: 'access_token',
    
    // guardian
    auth_type: 'oauth',
    auth_version: 1,
    auth_leg: 3
  },
  foursquare: {
    // auth
    base_url: 'https://foursquare.com/',
    access_url: 'https://foursquare.com/oauth2/access_token',
    authorize_url: 'https://foursquare.com/oauth2/authenticate',
    access_name: 'access_token',
    
    // guardian
    auth_type: 'oauth',
    auth_version: 2,
    auth_leg: 3
  },
  slack: {
    // auth
    base_url: 'https://slack.com/',
    access_url: 'https://slack.com/api/oauth.access',
    authorize_url: 'https://slack.com/oauth/authorize',
    access_name: 'access_token',
    
    // guardian
    auth_type: 'oauth',
    auth_version: 2,
    auth_leg: 3
  },
  instagram: {
    // auth
    base_url: 'https://api.instagram.com/',
    access_url: 'https://api.instagram.com/oauth/access_token',
    authorize_url: 'https://api.instagram.com/oauth/authorize',
    access_name: 'access_token',
    
    // guardian
    auth_type: 'oauth',
    auth_version: 2,
    auth_leg: 3
  },
  flickr: {
    // auth
    base_url: 'https://www.flickr.com/',
    access_url: 'https://www.flickr.com/services/oauth/access_token',
    request_url: 'https://www.flickr.com/services/oauth/request_token',
    authorize_url: 'https://www.flickr.com/services/oauth/authorize',
    access_name: 'access_token',
    
    // guardian
    auth_type: 'oauth',
    auth_version: 1,
    auth_leg: 3
  },
  disqus: {
    // auth
    base_url: 'https://disqus.com/',
    access_url: 'https://disqus.com/api/oauth/2.0/access_token',
    authorize_url: 'https://disqus.com/api/oauth/2.0/authorize',
    access_name: 'access_token',
    
    // guardian
    auth_type: 'oauth',
    auth_version: 2,
    auth_leg: 3
  },
  trello: {
    // auth
    base_url: 'https://trello.com/',
    access_url: 'https://trello.com/1/OAuthGetAccessToken',
    request_url: 'https://trello.com/1/OAuthGetRequestToken',
    authorize_url: 'https://trello.com/1/OAuthAuthorizeToken',
    access_name: 'access_token',
    
    // guardian
    auth_type: 'oauth',
    auth_version: 1,
    auth_leg: 3
  },
  asana: {
    // auth
    base_url: 'https://app.asana.com/',
    access_url: 'https://app.asana.com/-/oauth_token',
    authorize_url: 'https://app.asana.com/-/oauth_authorize',
    access_name: 'access_token',
    
    // guardian
    auth_type: 'oauth',
    auth_version: 2,
    auth_leg: 3
  },
  mailchimp: {
    // auth
    base_url: 'https://mailchimp.com/',
    access_url: 'https://login.mailchimp.com/oauth2/token',
    authorize_url: 'https://login.mailchimp.com/oauth2/authorize',
    access_name: 'access_token',
    
    // guardian
    auth_type: 'oauth',
    auth_version: 2,
    auth_leg: 3
  }
};
for (var provider in settings) {
  settings[provider][provider] = true;
  settings[provider].name = provider;

  settings[provider].get = function (app, config) {
    var s = dcopy(this);
    // app
    if (s.auth_version == 1) {
      s.consumer_key = app.key;
      s.consumer_secret = app.secret;
    }
    else if (s.auth_version == 2) {
      s.client_id = app.key;
      s.client_secret = app.secret;
    }

    // 
    s.headers = config.headers||null; // custom headers
    s.redirect = config.redirect||null; // full path callback url
    s.scope = config.scope||null;
    s.callback = config.callback||'';

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

exports = module.exports = settings;
