
var querystring   = require('querystring');

var express = require('express'),
  bodyParser = require('body-parser'),
  multipart = require('connect-multiparty'),
  cookieParser = require('cookie-parser'),
  session = require('express-session'),
  favicon = require('serve-favicon');
var request = require('request');

var gate = require('./lib/core'), keeper;
var config = require('./config');


function Guardian (_config) {
  var app = express()
    .use(favicon(__dirname+'/favicon.ico'))
    // body parser
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({extended: true}))
    .use(multipart())
    // session
    .use(cookieParser())
    .use(session({
      name: 'grant', secret: 'very secret',
      saveUninitialized: true, resave: true
    }));
  app.config = config.init(_config);

  app.get('/connect/:provider/:override?', function (req, res, next) {
    if (req.params.override == 'callback') return next();

    var provider = app.config.app[req.params.provider];
    if (req.params.override && provider.overrides) {
      var override = provider.overrides[req.params.override];
      if (override) provider = override;
    }

    req.session.provider = req.params.provider;

    if (req.query.test) return res.end(JSON.stringify(provider));
    connect(req, res, provider);
  });

  app.post('/connect/:provider/:override?', function (req, res) {
    var provider = app.config.app[req.params.provider];
    if (req.params.override && provider.overrides) {
      var override = provider.overrides[req.params.override];
      if (override) provider = override;
    }

    var options = {};
    for (var key in req.body) {
      if (!req.body[key]) continue;
      options[key] = req.body[key];
    }
    if (Object.keys(options).length) {
      provider = config.override(provider, options);
      config.transform(provider, options);
    }

    req.session.provider = req.params.provider;
    
    if (req.body.test) return res.end(JSON.stringify(provider));
    connect(req, res, provider);
  });

  function connect (req, res, provider) {
    // Generate options object
    var opts = {
      // oauth urls
      authorizeUrl: provider['authorize_url'],
      accessUrl: provider['access_url'],
      // OAuth1
      requestUrl: provider['request_url'],

      // oauth options
      accessName: provider['access_name'],
      grantType: provider['grant_type'],

      // not used
      authorizeMethod: provider['authorize_method'],
      signatureMethod: provider['signature_method'],
      oauth_token: provider['oauth_token'],
      version: provider['version'],
      baseUrl: provider['base_url'],

      // app credentials
      clientId: provider['client_id'],
      clientSecret: provider['client_secret'],
      consumerKey: provider['consumer_key'],
      consumerSecret: provider['consumer_secret'],

      // app options
      state: provider['state'],
      scope: provider['scope'],
      headers: provider['headers'],
      callbackUrl: provider.protocol+'://'+provider.host+'/connect/'+provider.name+'/callback',
      // custom app options - see below

      auth: {
        type: (provider['auth_type'] || 'oauth').replace(/[^a-z]/g, ''),
        flow: (provider['auth_flow'] || '').replace(/[^a-z\_]/g, ''),
        version: isNaN(parseInt(provider['auth_version'], 10)) ? false : parseInt(provider['auth_version'], 10),
        leg: isNaN(parseInt(provider['auth_leg'], 10)) ? false : parseInt(provider['auth_leg'], 10)
      },

      done: {
        callback: provider['callback']
      }
    };
    // custom app options
    if (provider.dropbox) {
      // used to set type=null for dropbox
      opts.type = provider['type'];
    }
    else if (provider.flickr) {
      // used to set scope permissions for flickr
      opts.perms = opts.scope;
      delete opts.scope;
    }
    else if (provider.google) {
      // used to set access_type=offline for google
      opts.access_type = provider['access_type'];
    }
    else if (provider.trello) {
      // used to set expiration=never for trello
      opts.expiration = provider['expiration'];
    }

    if (provider.grant) {
      if (req.session.provider == 'getpocket') {
        var redirect_uri = provider.protocol+'://'+provider.host+'/connect/'+provider.name+'/callback';
        request.post(provider.request_url, {
          headers: {
            'content-type':'application/x-www-form-urlencoded; charset=UTF8',
            'x-accept':'application/json'
          },
          form: {
            consumer_key:provider.key,
            redirect_uri:redirect_uri
            // state:'Grant'
          }
        }, function (err, _res, body) {
          if (err) console.log(err)
          var json = JSON.parse(body)
          console.log(json);
          req.session.payload = json;


          var url = provider.authorize_url + '?' + querystring.stringify({
            request_token:json.code,
            redirect_uri:redirect_uri
          })
          console.log(url);
          res.redirect(url);
        });
      } else {
        var redirect_uri = provider.protocol+'://'+provider.host+'/connect/'+provider.name+'/callback';
        res.redirect(provider.authorize_url + '?' + querystring.stringify({
          client_id:provider.key,
          response_type:'code',
          redirect_uri:redirect_uri,
          scope:provider.scope,
          state:provider.state
        }));
      }
      return;
    }

    // 1. Load plugin
    // 2. Run validation
    // 3. Store options object
    try {
      var path = gate.generatePluginPath(opts.auth);
      var plugin = gate.requirePlugin(opts.auth);
      var error = plugin.validate(opts);

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

      // Retrieve session data
      req.session.data = opts;

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
    } catch (e) {
      res.jsonp(500, {
        code: 'PLUGIN_MISSING',
        message: 'Invalid plugin specified, could not find plugin: ' + opts.auth.type.toLowerCase() + path.flow + path.version + path.leg
      });
    }
  };

  app.get('/step/:number', function (req, res) {
    keeper = gate({ req: req, res: res });
    keeper.invokeStep(parseInt(req.params.number, 10));
  });

  app.get('/connect/:provider/callback', function (req, res) {
    var provider = app.config.app[req.session.provider];
    if (provider.grant) {
      if (req.session.provider == 'getpocket') {
        request.post(provider.access_url, {
          headers: {
            'content-type':'application/x-www-form-urlencoded; charset=UTF8',
            // 'x-accept':'application/json'
            'x-accept':'application/x-www-form-urlencoded'
          },
          form: {
            consumer_key:provider.key,
            code:req.session.payload.code
          }
        }, function (err, _res, body) {
          if (err) console.log(err)
          console.log(body);
          res.redirect(provider.callback+'?'+body);
        });
      } else {
        var redirect_uri = provider.protocol+'://'+provider.host+'/connect/'+provider.name+'/callback';
        request.post(provider.access_url, {
          form:{
            client_id:provider.key,
            client_secret:provider.secret,
            code:req.query.code,
            redirect_uri:redirect_uri,
            grant_type:'authorization_code'
          }
        }, function (err, _res, body) {
          if (err) console.log(err);
          console.log(body);
          res.redirect(provider.callback+'?'+body);
        })
      }
      return;
    }

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
          : res.redirect(data.done.callback + '?' + querystring.stringify(response));
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

  return app;
}

exports = module.exports = Guardian;
