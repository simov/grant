
var express = require('express'),
    query   = require('querystring');
var gate    = require('./lib/core'), keeper;


function Guardian (config) {
  config = require('./config')(config);
  var app = express();

  app.get('/connect/:provider', function (req, res) {
    var provider = config.app[req.params.provider];
    var server = config.server;
    req.session.provider = req.params.provider;
    
    // Generate options object
    var opts = {
      clientId: provider['client_id'],
      clientSecret: provider['client_secret'],
      consumerKey: provider['consumer_key'],
      consumerSecret: provider['consumer_secret'],
      grantType: provider['grant_type'],
      state: provider['state'],
      scope: provider['scope'],
      baseUrl: provider['base_url'],
      requestUrl: provider['request_url'],
      accessUrl: provider['access_url'],
      accessName: provider['access_name'],
      authorizeUrl: provider['authorize_url'],
      authorizeMethod: provider['authorize_method'],
      signatureMethod: provider['signature_method'],
      oauth_token: provider['oauth_token'],
      // callbackUrl: provider['redirect'] ? provider['redirect'] : server.protocol + '://' + server.host + '/callback',
      callbackUrl: server.protocol+'://'+server.host+'/connect/'+provider.name+'/callback',
      version: provider['version'],
      headers: provider['headers'],
      type: provider['type'],

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
  });

  app.get('/step/:number', function (req, res) {
    keeper = gate({ req: req, res: res });
    keeper.invokeStep(parseInt(req.params.number, 10));
  });

  app.get('/connect/:provider/callback', function (req, res) {
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

  return app;
}

exports = module.exports = Guardian;
