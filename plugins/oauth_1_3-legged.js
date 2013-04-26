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
          return server.res.send(500, response.error.message);

        server.req.session.data.oauth_token = response.token;
        server.req.session.data.token_secret = response.secret;

        return next();
      }
    },

    2: {
      invoke: function (options) {
        options.res.redirect(options.authorizeUrl + '?oauth_token=' + (options.oauth_token || ''));
      }
    },

    callback: {
      next: function (server, response, next) {
        if (response.error) 
          return server.res.send(500, response.error.message);

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
          return server.res.send(500, response.error.message);

        next({
          access_token: response.token,
          access_secret: response.secret
        });
      }
    }
  }
};