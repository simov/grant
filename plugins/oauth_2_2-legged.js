var helper = require('./lib/helper');

module.exports = {
  "category": "oauth",
  "type": "2.0-two-legged",
  "steps": 1,
  "step": {

    // Authorize against service using signed request
    // https://github.com/Mashape/mashape-oauth/blob/master/FLOWS.md#oauth-10a-one-legged
    1: {
      invoke: function (options, server) {
        var oauth = helper.getOAuth2(options);
        oauth.getOAuthAccessToken(options.grantType || 'client_credentials', {
          type: options.type
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
          refresh_token: response.secret,
          expires_in: response.results.expires_in,
          token_type: response.results.token_type
        });
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
