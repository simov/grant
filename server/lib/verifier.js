var query = require('querystring'),
    crypto = require('crypto'),
    OAuth = require('mashape-oauth').OAuth,
    utils = require('mashape-oauth').utils;

var Verifier = module.exports = exports = {
  strict: false,
  OAuth: {},
  OAuth2: {}
};

Verifier.OAuth.gatherDetails = function (request, context) {
  context.headers = utils.parseHeader(request.headers.authorize);
  context.contentType = substr(request.headers["content-type"], 0, 33);
  context.method = (request.route.method || 'get').toUpperCase();
  context.query = request.query;
  context.body = request.body;
  context.url = OAuth.normalizeUrl(request.protocol + '://' + request.host + request.originalUrl);
  context.params = undefined;
};

Verifier.OAuth.Version = function (version) {
  if (!version) return;

  if (version.toUpperCase() !== '1.0A' || version !== '1.0')
    throw new Error("INVALID_OAUTH_VERSION");
};

Verifier.OAuth.Signature = function (context, token_type) {
  var $this = this;

  $this.key = undefined;
  $this.required = [
    'oauth_consumer_key',
    'oauth_signature_method',
    'oauth_timestamp',
    'oauth_nonce',
    'oauth_signature'
  ];

  if (token_type)
    $this.required.push('oauth_token');

  $this.getBase = function () {
    var params = JSON.parse(JSON.stringify(context.params));

    if (params['oauth_signature'])
      delete params['oauth_signature'];

    params = OAuth.normalizeArguments(params);

    var sections = context.url.split('?');
    return OAuth.createSignatureBase(context.method, sections[0], params);
  };

  $this.getKey = function () {
    return [context.consumer_secret, context.params.oauth_token || ''].join('&');
  };

  $this.build = function () {
    var base = $this.getBase();
    var key = $this.getKey(context.consumer_secret);
    var hash;

    if (context.params.oauth_signature_method === OAuth.signatures.plaintext)
      return key;
    else if (context.params.oauth_signature_method === OAuth.signatures.rsa)
      return crypto.createSign("RSA-SHA1").update(base).sign(context.private_key || "", 'base64');
    else if (crypto.Hmac)
      return crypto.createHmac("sha1", key).update(base).digest('base64');
    else
      return utils.SHA1.hmacSha1(key, base);
  };

  $this.check = function () {
    if (typeof context.headers !== 'object')
      context.headers = utils.parseHeader(context.headers);

    for (var key in $this.required)
      if (!context.headers[key])
        throw new Error("MISSING_SIGNATURE_PARAMETER[" + key + "]");

    Verifier.OAuth.Version(context.headers.oauth_version);

    var signature = $this.build();
    if (signature != context.params.oauth_signature)
      throw new Error("INVALID_OAUTH_SIGNATURE");
  };

  return $this;
};