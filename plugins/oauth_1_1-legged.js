var helper = require('./helper');

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
        server.res.set('Authorization', header);
        server.res.json({'authorization': header });
      }
    }
  }
};