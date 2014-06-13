var helper = require('./lib/helper');

module.exports = {
  "category": "oauth",
  "type": "1.0a-one-legged",
  "steps": 1,
  "step": {
    // Authorize against service using signed request
    // https://github.com/Mashape/mashape-oauth/blob/master/FLOWS.md#oauth-10a-one-legged
    1: {
      invoke: function (options, server) {
        var header = helper.getOAuthHeader(options);

        helper.handleCallback(options, server, {
          status: 200,

          headers: {
            'Authorization': header
          },

          data: {
            'authorization': header
          }
        });
      }
    }
  },

  "validate": function (opts) {
    if (!opts.call_url)
      return "Call Url is required.";

    return undefined;
  }
};
