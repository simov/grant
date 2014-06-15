#!/usr/bin/env node

// jshint laxbreak: true

var cluster = require('cluster'),
    ascii   = require('asciimo').Figlet,
    colors  = require('colors'),
    winston = require('winston'),
    fs      = require('fs'),
    args    = require('optimist').options('c', {
      "alias": 'config',
      "default": "default"
    }).argv,
    config = require('./config/' + args.config);

// Logging Setup
var log = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)()
  ]
});

// Start Master and Workers
ascii.write("guardian", "Thick", function (art) {
  if (cluster.isMaster) {
    console.info("\n" + art.rainbow);

    var i = 0;
    var pidPath = config.pid.dir + ".guardian.pid";

    fs.writeFileSync(pidPath, process.pid, 'utf8');
    console.info(("Master started with PID " + process.pid + ", saved at: " + pidPath).grey);
    console.info("Starting server on port " + config.port);

    for (i; i < config.workers; i++) cluster.fork();
  } else {
    /*
      guardian Setup
    */
    var gate    = require('./lib/core'), keeper;

    /*
      Express setup
    */
    var express = require('express'),
        redis   = require('redis'),
        query   = require('querystring'),
        utils   = require('mashape-oauth').utils,
        nuu     = require('nuuid'),
        http    = require('http'),
        https   = require('https'),
        url     = require('url');

    /*
      Setup Express & Logger
    */
    var app = express();

    /*
      Setup Redis Storage for Sessions
    */
    var RedisOptions = {};
    if (config.redis.pass) RedisOptions.no_ready_check = true;

    var RedisStore = require('connect-redis')(express);
    var RedisClient = redis.createClient(config.redis.port, config.redis.host, RedisOptions);
    var RedisSession = new RedisStore({ client: RedisClient });

    if (config.redis.pass)
      RedisClient.auth(config.redis.pass, function () {
        log.info('Authenticated redis client!');
      });

    // Configuration
    app.configure(function () {
      app.set('view engine', 'ejs');
      app.set('views', __dirname + '/_views');
      app.use(express.static(__dirname + '/_assets'));
      app.use(express.bodyParser());
      app.use(express.cookieParser(config.cookie.secret));
      app.use(express.session({ store: RedisSession, key: 'gate.keeper', secret: config.session.secret }));
      app.use(function (req, res, next) {
        res.header("X-powered-by", "Guardian, the last Gatekeeper.");
        next();
      });
    });

    app.get('/ping', function(req, res) {
      res.status(200);
      res.type('json').send({ping: "pong"});
    });

    app.post('/store', function (req, res) {
      var plugin;
      var error;
      var opts;
      var path;
      var id;

      // Generate options object
      opts = {
        clientId: req.param('client_id'),
        clientSecret: req.param('client_secret'),
        consumerKey: req.param('consumer_key'),
        consumerSecret: req.param('consumer_secret'),
        grantType: req.param('grant_type'),
        state: req.param('state'),
        scope: req.param('scope'),
        baseUrl: req.param('base_url'),
        requestUrl: req.param('request_url'),
        accessUrl: req.param('access_url'),
        accessName: req.param('access_name'),
        authorizeUrl: req.param('authorize_url'),
        authorizeMethod: req.param('authorize_method'),
        signatureMethod: req.param('signature_method'),
        oauth_token: req.param('oauth_token'),
        callbackUrl: req.param('redirect') ? req.param('redirect') : config.protocol + '://' + config.host + '/callback',
        version: req.param('version'),

        auth: {
          type: (req.param('auth_type') || 'oauth').replace(/[^a-z]/g, ''),
          flow: (req.param('auth_flow') || '').replace(/[^a-z\_]/g, ''),
          version: isNaN(parseInt(req.param('auth_version'), 10)) ? false : parseInt(req.param('auth_version'), 10),
          leg: isNaN(parseInt(req.param('auth_leg'), 10)) ? false : parseInt(req.param('auth_leg'), 10)
        },

        done: {
          callback: req.param('callback')
        }
      };

      // 1. Load plugin
      // 2. Run validation
      // 3. Store options object
      try {
        path = gate.generatePluginPath(opts.auth);
        plugin = gate.requirePlugin(opts.auth);
        error = plugin.validate(opts);

        // Check plugin
        if (!plugin) {
          throw new Error("PLUGIN_MISSING");
        }

        // Check plugin validation
        if (error) {
          return res.jsonp(500, {
            code: 'PLUGIN_VALIDATION',
            message: error
          });
        }

        // Convert underscores in signature method to dashes
        if (opts.signatureMethod && opts.signatureMethod.indexOf("_"))
          opts.signatureMethod = opts.signatureMethod.replace('_', '-');

        // Generate hash
        id = nuu.id(opts.consumerKey);

        // Store options in redis with hash identifier
        RedisClient.set(id, JSON.stringify(opts), redis.print);
        RedisClient.expire(id, config.redis.expire);

        console.log(id);

        // Generate output
        res.jsonp({ hash: id, url: config.protocol + '://' + config.host + '/start?hash=' + id });
      } catch (e) {
        res.jsonp(500, {
          code: 'PLUGIN_MISSING',
          message: 'Invalid plugin specified, could not find plugin: ' + opts.auth.type.toLowerCase() + path.flow + path.version + path.leg
        });
      }
    });

    app.get('/hash-check', function (req, res) {
      RedisClient.get(req.param('hash'), function (err, reply) {
        if (err) return res.send(500, err.message);
        res.json(JSON.parse(reply));
      });
    });

    app.all('/start', function (req, res) {
      var original = req.param('hash');
      var hash = (typeof original === 'string' ? original : '').replace(/[^a-z0-9\-]/gi, '');

      if (hash != original) {
        return res.json(500, {
          code: 'INVALID_HASH',
          message: 'Invalid hash sequence given. Please check hash and try again.'
        });
      }

      RedisClient.get(hash, function (err, reply) {
        if (err) {
          return res.json(500, {
            code: 'ERROR',
            message: err.message
          });
        }

        if (!reply) {
          return res.json(500, {
            code: 'EXPIRED_HASH',
            message: 'Hash (' + hash + ') has been expired.'
          });
        }

        // Retrieve session data
        req.session.data = JSON.parse(reply);

        // Setup data from response on session data object
        if (req.param('url'))
          req.session.data.call_url = req.param('url');

        if (req.param('method'))
          req.session.data.call_method = req.param('method');

        if (req.param('body'))
          req.session.data.call_body = req.param('body');

        if (req.param('parameters'))
          req.session.data.parameters = req.param('parameters');

        // Invoke guardian gatekeeper
        keeper = gate({ req: req, res: res });
        keeper.invokeStep(1);
      });
    });

    app.get('/step/:number', function (req, res) {
      keeper = gate({ req: req, res: res });
      keeper.invokeStep(parseInt(req.params.number, 10));
    });

    app.get('/callback', function (req, res) {
      var plugin;
      var step;
      var data;
      var args;

      if (!req.session.data) {
        return res.json(500, {
          code: 'MISSING_SESSION_DETAILS',
          message: 'Session details are missing, perhaps the redirect url is on another server or the request timed out.'
        });
      }

      // Parse session data
      data = JSON.parse(JSON.stringify(req.session.data));
      log.info(data);

      // Include plugin
      plugin = gate.requirePlugin(data.auth);

      if (!plugin.step.callback) {
        return res.json(500, {
          code: 'MISSING_CALLBACK_STEP',
          message: 'Callback step is missing, unable to continue authentication process.'
        });
      }

      // Fetch information from previously set data.
      step = req.session.data.step;
      args = {};

      // Retrieve information returned from authentication step
      if (req.param('oauth_token'))
        args.token = req.param('oauth_token');

      if (req.param('oauth_verifier'))
        args.verifier = req.param('oauth_verifier');

      if (req.param('code'))
        args.code = req.param('code');

      if (req.param('state'))
        args.state = req.param('state');

      // Next?
      plugin.step.callback.next({ req: req, res: res }, args, function (response) {
        if (response) {
          return (!data.done.callback || data.done.callback == "oob")
            ? res.json(response)
            : res.redirect(data.done.callback + '?' + query.stringify(response));
        }

        if ((step + 1) > plugin.steps) {
          return res.json(500, {
            code: 'ALL_STEPS_COMPLETE',
            message: 'All steps have been completed, authentication should have happened, please try again.'
          });
        }

        res.redirect('/step/' + (step + 1));
      });
    });

    app.use(function(req, res, next){
      res.status(404);

      // respond with html page
      if (req.accepts('html')) {
        return res.send(
          '<html><head><title>Guardian.js</title></head><body>This route doesn\'t exist. ' +
          'Please read the <a href=\'https://github.com/Mashape/guardian\'>documentation</a> ' +
          'to see the available routes.</body></html>'
        );
      }

      // respond with json
      if (req.accepts('json')) {
        return res.send({ error: 'Not found' });
      }

      // default to plain-text. send()
      res.type('txt').send('Not found');
    });

    app.listen(config.port);
    log.info(('Worker #' + cluster.worker.id + ' on duty!').grey);
  }

  // Listen for dying workers
  cluster.on('exit', function (worker) {
      log.warn('STAB!'.red + (' Another worker has died :( RIP Worker #' + worker.id + '!').grey);
      cluster.fork();
  });
});
