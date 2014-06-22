var helper = require('./lib/helper');

module.exports = {
  "category": "oauth",
  "type": "2.0-three-legged",
  "steps": 2,
  "step": {
    1: {
      invoke: function (options, server) {
        var oauth = helper.getOAuth2(options);
        var settings = {
          redirect_uri: options.callbackUrl,
          response_type: 'code'
        };

        if (options.scope)
          settings.scope = options.scope;

        if (options.state)
          settings.state = options.state;

        server.res.redirect(oauth.getAuthorizeUrl(settings));
      }
    },

    2: {
      invoke: function (options, server) {
        var oauth = helper.getOAuth2(options);

        oauth.getOAuthAccessToken(options.code, {
          redirect_uri: options.callbackUrl,
          grant_type: "authorization_code"
        }, options.next);
      },

      next: function (server, response, next) {
        if (response.error)
          return helper.handleCallback(server.req.session.data, server, {
            status: 500,

            data: {
              message: 'Could not authenticate with given credentials for request token.',
              data: response.error.data
            }
          });

        next({
          access_token: response.token,
          refresh_token: response.refresh,
          expires_in: response.results.expires_in,
          token_type: response.results.token_type
        });
      }
    },

    callback: {
      next: function (server, response, next) {
        // Place the code onto the options object under invoke methods
        server.req.session.data.code = response.code;

        // Go to the next step
        next();
      }
    }
  },

  "validate": function (opts) {
    if (!opts.clientId)
      return "Client ID is required.";

    if (!opts.clientSecret)
      return "Client Secret is required.";

    if (!opts.authorizeUrl)
      return "Authorization url is required.";

    return undefined;
  }
};
