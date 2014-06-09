var express = require('express'),
  request = require('request'),
  query = require('querystring'),
  args = require('optimist').
    options('key', {alias: 'k'}).
    options('secret', {alias: 's'}).
    options('host', {alias:'h'}).
    argv;

var options = {
  url: 'https://api.github.com/users/nijikokun',
  method: 'POST',
  auth: {
    base_url: 'https://github.com/',
    access_name: 'access_token',
    authorize_url: 'login/oauth/authorize',
    access_url: 'login/oauth/access_token',
    request_url: 'login/oauth/request_url',
  },
  form: {}
};

if (!args.key)
  throw new Error('Missing Consumer Key! -k cli option');

if (!args.secret)
  throw new Error('Missing Consumer Secret! -s cli option');

if (!args.host)
  throw new Error('Missing Host IP (Should be public ip not localhost)!');

// Application Details for Auth Leg
var app = express();
app.configure(function () {
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/_views');
  app.use(express.static(__dirname + '/_assets'));
  app.use(express.bodyParser());
  app.use(express.cookieParser('maeby, lets keep it a secret?'));
  app.use(express.session({ secret: 'no-more-secrets' }));
});

app.get('/', function (req, res) {
  request({
    method: 'POST',
    uri: 'http://' + args.host + ':3000/store',
    form: {
      client_id: args.key,
      client_secret: args.secret,

      base_url: options.auth.base_url,
      grant_type: options.auth.grant_type,
      access_url: options.auth.access_url,
      request_url: options.auth.request_url,
      authorize_url: options.auth.authorize_url,
      access_name: options.auth.access_name,

      auth_type: "oauth",
      auth_version: 2,
      auth_leg: 3,

      oauth_token: "",
      callback: "http://" + args.host + ":3001/callback"
    }
  }, function (error, response, body) {
    if (error) return console.log(error);
    body = JSON.parse(body);

    res.send('<a href="http://' + args.host + ':3000/start?hash=' + body.hash + '">Start Process</a>');
  });
});

app.get('/callback', function (req, res) {
  request({
    method: 'GET',
    uri: options.url + '?access_token=' + req.query.access_token,
    headers: {
      'User-Agent': 'Gatekeeper'
    }
  }, function (error, response, body) {
    res.json(JSON.parse(body));
  });
});

app.listen(3001);
console.log('app started at: http://' + args.host + ':3001');
