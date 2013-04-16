var Request = require('../../OAuth/request'),
    query = require('querystring'),
    utils = require('mashape-oauth').utils;

// OAuth One-Legged Flow Verification
module.exports = exports = function (request) {
  if (!request.headers || !request.headers.authorization)
    throw new Error("MISSING_HEADER");

  Request.gatherDetails(request, this);

  if (!this.headers)
    throw new Error("INVALID_AUTHORIZATION_HEADER");

  if (!this.headers.oauth_consumer_key)
    throw new Error("MISSING_CONSUMER_KEY");

  if (this.headers.oauth_token === undefined)
    throw new Error("MISSING_OAUTH_TOKEN");

  this.signature = Request.Signature(this, true);

  if (this.method === 'POST')
    if (this.contentType !== 'application/x-www-form-urlencoded' && Verifier.strict)
      throw new Error("INVALID_CONTENT_TYPE_POST");
    else this.params = utils.extend(this.headers, this.body);
  else this.params = utils.extend(this.headers, this.query);

  if (!this.params)
    throw new Error("MISSING_OAUTH_DATA");

  return this;
};