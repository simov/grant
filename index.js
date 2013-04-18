var express = require('express'),
    redis   = require('redis'),
    query   = require('querystring'),
    utils   = require('mashape-oauth').utils,
    plugin  = require('./plugins/oauth_1.0a_three-legged.js'),
    logger  = require('log');

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

app.get('/store', function (req, res) {
  // this is where they will post, and we will return a hash.
  // get for now to show the flow through the browser.
  req.session.data = {
    requestUrl: "https://api.twitter.com/oauth/request_token",
    authorizeUrl: "https://api.twitter.com/oauth/authorize",
    accessUrl: "https://api.twitter.com/oauth/access_token",
    callbackUrl: "http://67.169.69.70:3000/callback"
  };

  if (!req.session.step) req.session.step = 1;
  return res.redirect('/step/' + parseInt(req.session.step, 10));
});

app.get('/step/:number', function (req, res) {
  var step = parseInt(req.params.number, 10);
  if (step > plugin.steps || !req.session.data)
    return res.redirect('/done');

  // Store the current step
  req.session.data.step = step;

  // here we grab the data previously set
  var data = JSON.parse(JSON.stringify(req.session.data));

  // Information we should probably detail from providers before making requests:
  // signature_method
  // request_url
  // authorize_url
  // access_url

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

app.get('/done', function (req, res) {
  log.info('All steps have been completed.');
});

app.listen(3000);