var Verifier = require('../verifier');

// OAuth One-Legged Flow Verification
module.exports = exports = function (request) {
  if (!request.headers || !request.headers.authorize)
    throw new Error("MISSING_HEADER");

  if (typeof data !== 'object')
    this.data = query.parse(data);

  Verifier.OAuth.gatherDetails(request, this);

  if (!this.headers)
    throw new Error("INVALID_AUTHORIZATION_HEADER");

  if (!this.headers.oauth_consumer_key)
    throw new Error("MISSING_CONSUMER_KEY");

  if (!this.headers.oauth_token)
    throw new Error("MISSING_OAUTH_TOKEN");

  this.signature = Verifier.OAuth.signature(this, true);

  if (this.method === 'POST')
    if (this.contentType !== 'application/x-www-form-urlencoded' && Verifier.strict)
      throw new Error("INVALID_CONTENT_TYPE_POST");
    else this.params = utils.extend(this.headers, this.body);
  else this.params = utils.extend(this.headers, this.query);

  if (!this.params)
    throw new Error("MISSING_OAUTH_DATA");

  return this;
};