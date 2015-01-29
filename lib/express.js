
var express = require('express'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  session = require('express-session')

var config = require('./config')
var flows = {
  1: require('./oauth1'),
  2: require('./oauth2'),
  getpocket: require('./getpocket')
}


function Grant (_config) {
  var app = express()
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({extended: true}))
  app.use(cookieParser())
  app.use(session({
      name: 'grant', secret: 'very secret',
      saveUninitialized: true, resave: true
    }))

  app.config = config.init(_config)

  app.get('/connect/:provider/:override?', function (req, res, next) {
    if (req.params.override == 'callback') return next()

    req.session.grant = {
      provider:req.params.provider,
      override:req.params.override
    }

    connect(req, res)
  })

  app.post('/connect/:provider/:override?', function (req, res) {
    req.session.grant = {
      provider:req.params.provider,
      override:req.params.override,
      dynamic:req.body
    }

    connect(req, res)
  })

  function connect (req, res) {
    var grant = req.session.grant
    var provider = config.provider(app.config, grant)
    var flow = flows[provider.oauth]

    if (provider.oauth == 1) {
      flow.step1(provider, function (err, data) {
        if (err) return res.redirect(provider.callback + '?' + err)
        grant.step1 = data
        var url = flow.step2(provider, data)
        res.redirect(url)
      })
    }

    else if (provider.oauth == 2) {
      grant.state = provider.state
      var url = flow.step1(provider)
      res.redirect(url)
    }

    else if (provider.custom) {
      flow = flows[provider.name]
      flow.step1(provider, function (err, data) {
        if (err) return res.redirect(provider.callback + '?' + err)
        grant.step1 = data
        var url = flow.step2(provider, data)
        res.redirect(url)
      })
    }
  }

  app.get('/connect/:provider/callback', function (req, res) {
    var grant = req.session.grant
    var provider = config.provider(app.config, grant)
    var flow = flows[provider.oauth]

    if (provider.oauth == 1) {
      flow.step3(provider, grant.step1, req.query, function (err, url) {
        if (err) return res.redirect(provider.callback + '?' + err)
        res.redirect(url)
      })
    }

    else if (provider.oauth == 2) {
      flow.step2(provider, req.query, grant, function (err, data) {
        if (err) return res.redirect(provider.callback + '?' + err)

        switch( provider.name ){
          case "facebook":
              var http = require( 'https' );
              var firstSplit = data.split( '&' );
              var secondSplit = firstSplit[0].split( '=' );

              var token = secondSplit[1];
              var urlFace = 'https://graph.facebook.com/v2.2/me?access_token=';

              // console.log( 'TOKEN: ' + token );
              // console.log( '=======================================' );
              http.get( urlFace + token, function(response){
                  var body = '';
                  response.on('data', function(chunk) {
                      body += chunk;
                  });
                  response.on('end', function() {
                      var result = JSON.parse( body );

                       // console.log( "result: " + result );


                      var customData = {
                        "displayName" : result.name,
                        "id" : result.id,
                        "name" : {
                          "first" : result.first_name,
                          "last" : result.last_name
                        },
                        "email" : result.email,
                        "token" : token
                      }

                      var url = flow.step3(provider, customData )
                      res.redirect(url);
                  });
              });

              break;

          case "google":
              var http = require( 'https' );
              var urlGoogle = 'https://www.googleapis.com/plus/v1/people/me?access_token=';

              var pegaToken = JSON.parse( data );
              var token = pegaToken.access_token;

              // console.log( 'TOKEN: ' + token );

              http.get( urlGoogle + token, function(response){
                  var body = '';
                  response.on('data', function(chunk) {
                      body += chunk;
                  });
                  response.on('end', function() {
                      var result = JSON.parse( body );

                      var customData = {
                        "displayName" : result.displayName,
                        "id" : result.id,
                        "name" : {
                          "first" : result.name.familyName,
                          "last" : result.name.givenName
                        },
                        "email" : result.emails[0].value,
                        "token" : token
                      }

                      var url = flow.step3(provider, customData )
                      res.redirect(url);
                  });
              });
              break;

          default :
              var url = flow.step3(provider, data);
              res.redirect(url);
        }
      })
    }

    else if (provider.custom) {
      flow = flows[provider.name]
      flow.step3(provider, grant.step1, function (err, url) {
        if (err) return res.redirect(provider.callback + '?' + err)
        res.redirect(url)
      })
    }
  })

  return app
}

exports = module.exports = Grant
