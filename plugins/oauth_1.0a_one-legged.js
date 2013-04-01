var OAuth = require('mashape-oauth').OAuth;

module.exports = {
  "category": "oauth",
  "type": "1.0a-one-legged",
  "steps": {
    // Authorize against service using signed request
    // https://github.com/Mashape/mashape-oauth/blob/master/FLOWS.md#oauth-10a-one-legged
    1: function (options, auth) {
      var oa = new OAuth({
        echo: auth.echo || undefined,
        requestUrl: auth.requestUrl,
        accessUrl: auth.accessUrl,
        headers: auth.headers || undefined,
        consumerKey: auth.consumerKey || undefined,
        consumerSecret: auth.consumerSecret || undefined,
        signatureMethod: auth.signatureMethod || OAuth.signatures.hmac,
        nonceLength: auth.nonceLength || 32,
        clientOptions: auth.clientOptions || undefined,
        version: auth.version || '1.0A'
      });

      var parameters = options.parameters || {};
      parameters.oauth_token = "";

      return oa[options.method]({
        url: options.url,
        body: options.body,
        type: options.type,
        parameters: parameters
      }, options.next);
    }
  }
};