
var querystring   = require('querystring');

var express = require('express'),
  bodyParser = require('body-parser'),
  multipart = require('connect-multiparty'),
  cookieParser = require('cookie-parser'),
  session = require('express-session'),
  favicon = require('serve-favicon');

var request = require('request');
var config = require('./config');


function Grant (_config) {
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
    /*
      // OAuth urls
      request_url, authorize_url, access_url
      // OAuth parameters
      access_name, grant_type, type
      authorize_method, signature_method, oauth_token, version, base_url
      state, scope, redirect_uri
      // app credentials
      client_id, client_secret, consumer_key, consumer_secret
    */

    // custom app options
    // if (provider.dropbox) {
    //   // used to set type=null for dropbox
    //   provider['type'];
    // }
    // else if (provider.flickr) {
    //   // used to set scope permissions for flickr
    //   // opts.perms = opts.scope;
    //   // delete opts.scope;
    // }
    // else if (provider.google) {
    //   // used to set access_type=offline for google
    //   provider['access_type'];
    // }
    // else if (provider.trello) {
    //   // used to set expiration=never for trello
    //   opts.expiration = provider['expiration'];
    // }

    var redirect_uri = provider.protocol+'://'+provider.host+'/connect/'+provider.name+'/callback';

    if (provider.oauth == 1) {
      request.post(provider.request_url, {
        oauth:{
          callback:redirect_uri,
          consumer_key:provider.key,
          consumer_secret:provider.secret
        }
      }, function (err, _res, body) {
        if (err) console.log(err);
        var data = querystring.parse(body);
        req.session.payload = data;

        var params = {
          oauth_token:data.oauth_token
        }
        if (provider.flickr) {
          params.perms = provider.scope;
        }
        if (provider.trello) {
          params.scope = provider.scope;
          params.expiration = provider.expiration;
        }

        var url = provider.authorize_url + '?' + querystring.stringify(params)
        res.redirect(url);
      });
    }

    else if (provider.oauth == 2) {
      var params = {
        client_id:provider.key,
        response_type:'code',
        redirect_uri:redirect_uri,
        scope:provider.scope,
        state:provider.state
      }
      if (provider.google) {
        params.access_type = provider.access_type;
      }
      res.redirect(provider.authorize_url + '?' + querystring.stringify(params));
    }

    else if (provider.custom) {
      if (provider.name == 'getpocket') {
        request.post(provider.request_url, {
          headers: {
            'content-type':'application/x-www-form-urlencoded; charset=UTF8',
            // 'x-accept':'application/json'
            'x-accept':'application/x-www-form-urlencoded'
          },
          form: {
            consumer_key:provider.key,
            redirect_uri:redirect_uri,
            state:provider.state
          }
        }, function (err, _res, body) {
          if (err) console.log(err)
          var data = querystring.parse(body);
          req.session.payload = data;

          var url = provider.authorize_url + '?' + querystring.stringify({
            request_token:json.code,
            redirect_uri:redirect_uri
          })
          res.redirect(url);
        });
      }
    }
  };

  app.get('/connect/:provider/callback', function (req, res) {
    var provider = app.config.app[req.session.provider];

    if (provider.oauth == 1) {
      var data = req.session.payload;
      delete req.session.payload;
      request.post(provider.access_url, {
        oauth:{
          consumer_key:provider.key,
          consumer_secret:provider.secret,
          token:req.query.oauth_token,
          token_secret:data.oauth_token_secret,
          verifier:req.query.oauth_verifier
        }
      }, function (err, _res, body) {
        if (err) console.log(err);
        res.redirect(provider.callback + '?' + body);
      });
    }
    else if (provider.oauth == 2) {
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
        res.redirect(provider.callback + '?' + body);
      });
    }

    else if (provider.custom) {
      if (provider.name == 'getpocket') {
        var data = req.session.payload;
        delete req.session.payload;
        request.post(provider.access_url, {
          headers: {
            'content-type':'application/x-www-form-urlencoded; charset=UTF8',
            // 'x-accept':'application/json'
            'x-accept':'application/x-www-form-urlencoded'
          },
          form: {
            consumer_key:provider.key,
            code:data.code
          }
        }, function (err, _res, body) {
          if (err) console.log(err);
          res.redirect(provider.callback + '?' + body);
        });
      }
    }
  });

  return app;
}

exports = module.exports = Grant;
