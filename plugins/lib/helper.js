var moth = require('mashape-oauth'), winston = require('winston'), query = require('querystring');

var helper = module.exports = exports = {
  OAuth: moth.OAuth,
  OAuth2: moth.OAuth2,
  http: require('http'),
  https: require('https'),
  log: new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: './logs/console.log' })
    ]
  }),
  url: require('url'),
  utils: moth.utils
};

helper.getOAuth = function (options) {
  return new helper.OAuth({
    echo: options.echo || undefined,
    requestUrl: options.requestUrl,
    accessUrl: options.accessUrl,
    callback: options.callbackUrl || undefined,
    headers: options.headers || undefined,
    consumerKey: options.consumerKey || undefined,
    consumerSecret: options.consumerSecret || undefined,
    signatureMethod: options.signatureMethod || helper.OAuth.signatures.hmac,
    nonceLength: options.nonceLength || 32,
    clientOptions: options.clientOptions || undefined,
    version: options.version || '1.0A'
  });
};

helper.getOAuth2 = function (options) {
  return new helper.OAuth2({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    baseUrl: options.baseUrl,
    authUrl: options.authorizeUrl,
    authMethod: options.authorizeMethod,
    accessTokenUrl: options.accessUrl,
    accessTokenName: options.accessName,
    headers: options.headers || undefined
  });
};

helper.getOAuthHeader = function (options) {
  var oauth = helper.getOAuth(options);
  var parameters = oauth.prepareParameters({
    url: options.call_url,
    body: options.call_body || undefined,
    method: options.call_method || undefined,
    oauth_token: options.oauth_token || undefined,
    oauth_token_secret: options.oauth_token_secret || undefined,
    oauth_verifier: options.oauth_verifier || undefined
  });

  return oauth.buildAuthorizationHeaders(parameters);
};

helper.handleCallback = function (options, server, details) {
  if (!options.done.callback || options.done.callback == "oob") {
    if (details.headers)
      for (var i in details.headers)
        if (details.headers.hasOwnProperty(i))
          server.res.set(i, details.headers[i]);

    return server.res.json(details.status, details.data);
  }

  return server.res.redirect(options.done.callback + '?' + query.stringify(details.data));
};

helper.getProxy = function (req, res) {
  return (req.protocol === 'https' ? https : http).createClient(req.headers.host.match(/:/g) ? req.headers.host.split(":")[0] : 80, req.host);
};