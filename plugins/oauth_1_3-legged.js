var helper = require('./lib/helper'), log = helper.log;

module.exports = {
  "category": "oauth",
  "type": "1.0a-three-legged",
  "steps": 3,
  "step": {
    1: {
      invoke: function (options) {
        var oa = helper.getOAuth(options);
        oa.getOAuthRequestToken(options.parameters || {}, options.next);
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

        server.req.session.data.oauth_token = response.token;
        server.req.session.data.token_secret = response.secret;

        return next();
      }
    },

    2: {
      invoke: function (options, server) {
        server.res.redirect(options.authorizeUrl + '?oauth_token=' + (options.oauth_token || ''));
      }
    },

    callback: {
      next: function (server, response, next) {
        if (response.error) 
          return helper.handleCallback(server.req.session.data, server, {
            status: 500,

            data: { 
              message: 'Could not determine token and verifier.',
              data: response.error.data
            }
          });

        server.req.session.data.oauth_token = response.token;
        server.req.session.data.oauth_verifier = response.verifier;

        next();
      }
    },

    3: {
      invoke: function (options) {
        var oa = helper.getOAuth(options);
        var opts = { parameters: options.parameters || {} };

        opts.parameters.oauth_verifier = options.oauth_verifier;
        opts.parameters.oauth_token = options.oauth_token;
        oa.getOAuthAccessToken(opts, options.next);
      },

      next: function (server, response, next) {
        if (response.error) 
          return helper.handleCallback(server.req.session.data, server, {
            status: 500,

            data: { 
              message: 'Could not determine access_token and access_secret.',
              data: response.error.data
            }
          });

        next({
          access_token: response.token,
          access_secret: response.secret
        });
      }
    }
  }
};