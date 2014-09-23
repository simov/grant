
var express = require('express'),
  logger = require('morgan'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  session = require('express-session'),
  favicon = require('serve-favicon');
var consolidate = require('consolidate'),
  hogan = require('hogan.js');


var grant = new require('grant')({
  server: require('./config/server.json'),
  credentials: require('./config/credentials.json'),
  options: require('./config/options.json')
});


var app = express()
  .use(favicon(__dirname+'/favicon.ico'))
  .use(cookieParser())
  .use(session({
    name: 'grant', secret: 'very secret',
    saveUninitialized: true, resave: true
  }))

  .use(function (req, res, next) {
    var server = grant.config.server;

    if (/^\/connect\/(\w+)$/.test(req.url)) {
      var provider = req.url.replace(/^\/connect\/(\w+)$/,'$1');

      if (/heroku|dropbox|box/.test(provider)) {
        if (server.protocol != 'https') {
          server.protocol = 'https';
          var url = server.protocol+'://'+server.host+'/connect/'+provider;
          return res.redirect(url);
        }
      }
      else {
        if (server.protocol != 'http') {
          server.protocol = 'http';
          var url = server.protocol+'://'+server.host+'/connect/'+provider;
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
  console.log(req.query);

  var providers = [
    'twitter', 'facebook', 'linkedin', 'soundcloud', 'stocktwits',
    'bitly', 'github', 'stackexchange', 'google', 'yahoo',
    'foursquare', 'slack', 'instagram', 'flickr', 'trello',
    'asana', 'mailchimp', 'heroku', 'dropbox', 'openstreetmap',
    'box', 'stripe', 'tumblr'

    // 'disqus'
  ];

  var current = req.session.provider;
  delete req.session.provider;

  var params = [];

  providers.forEach(function (provider) {
    var obj = {url:'/connect/'+provider, name:provider};
    if (current == provider) {
      obj.credentials = req.query;
      obj.json = JSON.stringify(req.query, null, 4);
    }
    params.push(obj);
  });
  res.render('template', {providers:params});
});

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
