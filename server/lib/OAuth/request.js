var query = require('querystring'),
    crypto = require('crypto'),
    OAuth = require('mashape-oauth').OAuth,
    utils = require('mashape-oauth').utils;

var Request = module.exports = exports = function (request, strict) {
  Request.gatherDetails(request, this);
  this.strict = strict || false;
  this.req = request;
  this.params = utils.extend(this.headers, (this.method === 'POST') ? this.body : this.query);

  this.isSigned = function () {
    return (this.params && this.params.oauth_signature);
  };

  this.verifySignature = function (token_type) {
    var signed = false;
    token_type = token_type || 'access';

    if (this.params.oauth_consumer_key)
      signed = this.verify(token_type);

    return signed;
  };

  this.verify = function () {

  };
};

Request.gatherDetails = function (request) {
  if (request.headers && request.headers.authorization)
    context.headers = utils.parseHeader(request.headers.authorization);
  else throw new Error("MISSING_AUTHORIZATION_HEADER");

  context.contentType = request.headers["content-type"].substring(0, 33);
  context.method = (request.route.method || 'get').toUpperCase();
  context.query = request.query;
  context.body = request.body;
  context.url = OAuth.normalizeUrl(request.protocol + '://' + request.host + request.originalUrl);
  context.params = undefined;
};

Request.Version = function (version) {
  if (!version) return;

  if (version.toUpperCase() !== '1.0A' || version !== '1.0')
    throw new Error("INVALID_OAUTH_VERSION");
};

Request.Signature = function (context, token_type) {
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

    // We don't utilize these in the original signature
    // These two have been appended or generated after it's creation
    if (params['oauth_signature']) delete params['oauth_signature'];
    if (params['bearer']) delete params['bearer'];

    // Here we normalize the arguments as if we were generating a request ourselves
    params = OAuth.normalizeArguments(params);

    var sections = context.url.split('?');
    return [context.method.toUpperCase(), utils.encodeData(sections[0]), utils.encodeData(params)].join('&');
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

  $this.verify = function () {
    if (typeof context.headers !== 'object')
      context.headers = utils.parseHeader(context.headers);

    for (var key in $this.required)
      if (!context.headers[key])
        throw new Error("MISSING_SIGNATURE_PARAMETER[" + key + "]");

    Request.Version(context.headers.oauth_version);

    var signature = $this.build();
    if (signature != context.params.oauth_signature)
      throw new Error("INVALID_OAUTH_SIGNATURE");
  };

  return $this;
};