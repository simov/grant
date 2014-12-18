
var express = require('express'),
  logger = require('morgan'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  session = require('express-session'),
  favicon = require('serve-favicon');
var consolidate = require('consolidate'),
  hogan = require('hogan.js');
var extend = require('extend');

var config = {
  server: require('./config/server.json'),
  credentials: require('./config/credentials.json'),
  options: require('./config/options.json')
};

function transform (config) {
  var result = {server: config.server};
  for (var key in config.credentials) {
    var provider = {};
    extend(true, provider, config.credentials[key], config.options[key]);
    result[key] = provider;
  }
  return result;
}


var grant = new require('grant')(transform(config));


var app = express()
  .use(favicon(__dirname+'/favicon.ico'))
  .use(cookieParser())
  .use(session({
    name: 'grant', secret: 'very secret',
    saveUninitialized: true, resave: true
  }))

  .use(function (req, res, next) {
    if (/^\/connect\/(\w+)$/.test(req.url)) {
      var name = req.url.replace(/^\/connect\/(\w+)$/,'$1');
      var provider = grant.config.app[name];

      if (provider.protocol == 'https') {
        if (/^http:/.test(req.headers.referer)) {
          var url = provider.protocol+'://'+provider.host+'/connect/'+provider.name;
          return res.redirect(url);
        }
      }
      else {
        if (/^https:/.test(req.headers.referer)) {
          var url = provider.protocol+'://'+provider.host+'/connect/'+provider.name;
          return res.redirect(url);
        }
      }
    }

    next();
  })

  .use(grant)
  .set('port', process.env.PORT||3000)

  .set('views', __dirname)
  .set('view engine', 'html')
  .set('view cache', true)
  .engine('html', consolidate.hogan)

  .use(logger('dev'))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({extended: true}));


app.get('/', function (req, res) {
  // feedly sandbox redirect_uri
  if (req.session.provider == 'feedly' && req.query.code) {
    var q = require('querystring');
    res.redirect('/connect/feedly/callback?'+q.stringify(req.query));
    return;
  }

  console.log(req.query);

  var current = req.session.provider;
  delete req.session.provider;

  var providers = Object.keys(grant.config.oauth);
  var params = [];

  providers.forEach(function (provider) {
    var obj = {url:'/connect/'+provider, name:provider};
    if (current == provider) {
      obj.credentials = req.query;
      var key = req.query.error ? 'error' : 'raw';
      obj.credentials[key] = JSON.stringify(req.query[key], null, 4);
    }
    params.push(obj);
  });
  res.render('template', {providers:params});
});

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
