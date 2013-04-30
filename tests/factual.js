var request = require('request'),
  query = require('querystring'),
  args = require('optimist').
    options('key', { alias: 'k' }).
    options('secret', { alias: 's' }).
    options('signature', { alias: 'm', default: "HMAC-SHA1" }).
    argv;

var options = {
  url: 'http://api.v3.factual.com/t/places',
  method: 'GET'
};

if (!args.key) 
  throw new Error('Missing Consumer Key! -key cli option');

if (!args.secret) 
  throw new Error('Missing Consumer Secret! -secret cli option');

request({
  method: 'POST',
  uri: 'http://localhost:3000/store',
  form: {
    consumer_key: args.key,
    consumer_secret: args.secret,
    signature_method: args.signature,

    auth_type: "oauth",
    auth_version: 1,
    auth_leg: 1,

    callback: "oob",
    version: "1.0"
  }
}, function (error, response, body) {
  if (error) return console.log(error);
  body = JSON.parse(body);

  request({
    method: 'POST',
    uri: 'http://localhost:3000/start',
    form: {
      hash: body.hash,

      // Request Details
      method: options.method,
      url: options.url
    },
    followAllRedirects: true
  }, function (error, response, body) {
    var auth = JSON.parse(body).authorization;

    var req = request({
      method: options.method,
      uri: options.url,
      headers: {
        "Authorization": auth
      }
    }, function (error, response, body) {
      console.log(body);
    });
    console.log(req.headers);
  });
});