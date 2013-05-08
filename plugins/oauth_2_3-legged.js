var helper = require('./lib/helper');

module.exports = {
  "category": "oauth",
  "type": "2.0-three-legged",
  "steps": 2,
  "step": {
    // Authorize against service using signed request
    // https://github.com/Mashape/mashape-oauth/blob/master/FLOWS.md#oauth-10a-one-legged
    1: {
      invoke: function (options, server) {
        var oauth = helper.getOAuth2(options);

        server.res.redirect(oauth.getAuthorizeUrl({
          redirect_uri: options.callbackUrl,
          scope: options.scope || undefined,
          state: options.state || undefined,
          response_type: 'code'
        }));
      }
    },


    2: {
      invoke: function (options, server) {
        var oauth = helper.getOAuth2(options);
        oauth.getOAuthAccessToken(options.code, {
          redirect_uri: options.callbackUrl,
          grant_type: options.grantType
        }, options.next);
      },

      next: function (server, response, next) {
        if (response.error)
          return server.res.send(500, response.error.message);

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
  }
};