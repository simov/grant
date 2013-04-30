var request = require('request'),
  query = require('querystring'),
  args = require('optimist').options('key', {alias: 'k'}).options('secret', {alias: 's'}).argv;

var options = {
  url: 'https://api.toopher.com/v1/pairings/create',
  method: 'POST',
  form: {
    pairing_phrase: 'generic-phrase',
    user_name: 'gatekeeper',
    user_id: 'gate.keeper'
  }
};

if (!args.key) 
  throw new Error('Missing Consumer Key! -k cli option');

if (!args.secret) 
  throw new Error('Missing Consumer Secret! -s cli option');

request({
  method: 'POST',
  uri: 'http://localhost:3000/store',
  form: {
    consumer_key: args.key,
    consumer_secret: args.secret,
    signature_method: "PLAINTEXT",

    auth_type: "oauth",
    auth_version: 1,
    auth_leg: 1,

    oauth_token: "",

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
      url: options.url,
      parameters: options.form
    },
    followAllRedirects: true
  }, function (error, response, body) {
    var auth = JSON.parse(body).authorization;

    var req = request({
      method: options.method,
      uri: options.url,
      form: options.form,
      headers: {
        "Authorization": auth
      }
    }, function (error, response, body) {
      console.log('BODY: ' + body);
    });
    
    console.log('HEADERS: ' + req.headers);
  });
});