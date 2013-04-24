var OAuth = require('mashape-oauth').OAuth,
    logger = require('log'),
    log = new logger();

function generate (options) {
  return new OAuth({
    echo: options.echo || undefined,
    requestUrl: options.requestUrl,
    accessUrl: options.accessUrl,
    callback: options.callbackUrl || undefined,
    headers: options.headers || undefined,
    consumerKey: options.consumerKey || undefined,
    consumerSecret: options.consumerSecret || undefined,
    signatureMethod: options.signatureMethod || OAuth.signatures.hmac,
    nonceLength: options.nonceLength || 32,
    clientOptions: options.clientOptions || undefined,
    version: options.version || '1.0A'
  });
}

module.exports = {
  "category": "oauth",
  "type": "1.0a-three-legged",
  "steps": 3,
  "step": {
    1: {
      invoke: function (options) {
        var oa = generate(options);
        oa.getOAuthRequestToken(options.parameters || {}, options.next);
      },

      next: function (server, response, next) {
        if (response.error) return log.info(response.error.message);

        log.info('Token: ' + response.token);
        log.info('Secret: ' + response.secret);

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
        if (response.error) return log.info(response.error.message);

        log.info('Token: ' + response.token);
        log.info('Verifier: ' + response.verifier);

        // server.req.session.data.oauth_token = response.token;
        server.req.session.data.oauth_verifier = response.verifier;

        next();
      }
    },

    3: {
      invoke: function (options) {
        var oa = generate(options);
        var opts = {
          parameters: options.parameters || {}
        };

        opts.parameters.oauth_verifier = options.oauth_verifier;
        opts.parameters.oauth_token = options.oauth_token;
        oa.getOAuthAccessToken(opts, options.next);
      },

      next: function (server, response) {
        if (response.error) return console.log(response.error);

        log.info('access, token: ' + response.token);
        log.info('access, secret: ' + response.secret);
      }
    }
  }
};