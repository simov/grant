var express = require('express'),
    redis   = require('redis'),
    query   = require('querystring'),
    utils   = require('mashape-oauth').utils,
    nuu     = require('nuuid');
    logger  = require('log'),
    args    = require('optimist').options('h', {
      "alias": 'host',
      "default": '67.169.69.70:3000'
    }).options('p', {
      "alias": 'protocol',
      "default": 'http'
    }).options('port', {
      "default": 3000
    }).argv;

/*
  Setup Express & Logger
 */
var app = express();
var log = new logger();

/*
  Setup Redis Storage for Sessions
 */
var RedisStore = require('connect-redis')(express);
var RedisClient = redis.createClient();
var RedisSession = new RedisStore({ client: RedisClient });

// Configuration
app.configure(function () {
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/_views');
  app.use(express.static(__dirname + '/_assets'));
  app.use(express.bodyParser());
  app.use(express.cookieParser('maeby, lets keep it a secret?'));
  app.use(express.session({ store: RedisSession, key: 'gate.keeper', secret: 'no-more-secrets' }));
});

app.post('/store', function (req, res) {
  var opts = {
    consumerKey: req.param('consumer_key'),
    consumerSecret: req.param('consumer_secret'),
    requestUrl: req.param('request_url'),
    accessUrl: req.param('access_url'),
    authorizeUrl: req.param('authorize_url'),
    signatureMethod: req.param('signature_method'),
    auth: {
      type: (req.param('auth_type') || 'oauth').replace(/[^a-z]/, ''),
      version: isNaN(parseInt(req.param('auth_version'), 10)) ? false : parseInt('auth_version', 10),
      leg: isNaN(parseInt(req.param('auth_leg'), 10)) ? false : parseInt('auth_leg', 10)
    },
    callbackUrl: args.p + '://' + args.h + '/callback',
    callbackFinal: req.param('callback')
  }, id = nuu.id(opts.consumerKey);

  // Retrieve additional pylons here -- api authentication details
  RedisClient.set(id, JSON.stringify(opts), redis.print);
  RedisClient.expire(id, 10);

  res.jsonp({ hash: id });
});

app.get('/hash-check', function (req, res) {
  var opts = RedisClient.get(req.param('hash'), function (err, reply) {
    if (err) return res.send(500, err.message);
    res.json(JSON.parse(reply));
  });
});

app.get('/start', function (req, res) {
  var opts = RedisClient.get(req.param('hash'), function (err, reply) {
    if (err) return res.send(500, err.message);
    req.session.data = JSON.parse(reply);
    res.redirect('/step/1');
  });
});

app.get('/step/:number', function (req, res) {
  // Fetch Data, Load Plugin, Continue.
  var data = JSON.parse(JSON.stringify(req.session.data));
  var plugin = require('./plugins/' + data.auth.type.toLowerCase() + (data.auth.version && typeof data.auth.version === 'number' ? '_' + data.auth.version + '_' : '') + (data.auth.leg && typeof data.auth.leg === 'number' ? '_' + data.auth.leg + '-legged' : '') + '.js');
  var step = parseInt(req.params.number, 10);

  if (step > plugin.steps || !req.session.data)
    return res.redirect('/done');

  // Store the current step
  req.session.data.step = step;

  // Passing information
  data.res = res;
  data.req = req;

  // Next
  if (plugin.step[step].next)
    data.next = function () {
      var args = Array.prototype.slice.call(arguments);
      if (args.length > 3) args = { error: args[0], token: args[1], secret: args[2], results: args[3] };
      else args = { error: args[0], data: args[1], response: args[2] };
      return plugin.step[step].next({ req: req, res: res }, args, ((step + 1) > plugin.steps) ? undefined : function () {
        return res.redirect('/step/' + (step + 1));
      });
    };

  plugin.step[step].invoke(data);
});

app.get('/callback', function (req, res) {
  if (!req.session.data) throw new Error('MISSING_SESSION_DETAILS');
  if (!plugin.step.callback) throw new Error('MISSING_CALLBACK_STEP');

  // here we grab the data previously set
  var step = req.session.data.step;

  // Verifier & Token
  var args = {};
  args.token = req.body.oauth_token || req.query.oauth_token;
  args.verifier = req.body.oauth_verifier || req.query.oauth_verifier;

  // Next?
  plugin.step.callback.next({ req: req, res: res }, args, function () {
    if ((step + 1) > plugin.steps) return res.redirect('/done');
    res.redirect('/step/' + (step + 1));
  });
});

app.listen(args.port);