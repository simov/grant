
var express = require('express'),
  logger = require('morgan'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  session = require('express-session');
var consolidate = require('consolidate'),
  hogan = require('hogan.js');


var grant = new require('../guardian')({
  server: require('./config/server.json'),
  credentials: require('./config/credentials.json'),
  options: require('./config/options.json')
});


var app = express()
  .use(grant)
  .set('port', process.env.PORT||3000)

  .set('views', __dirname)
  .set('view engine', 'html')
  .set('view cache', true)
  .engine('html', consolidate.hogan)

  .use(logger('dev'))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({extended: true}))

  .use(cookieParser())
  .use(session({
    name: 'grant', secret: 'very secret',
    saveUninitialized: true, resave: true
  }));


app.get('/', function (req, res) {
  console.log(req.query);

  var providers = [
    'twitter', 'facebook', 'linkedin', 'soundcloud', 'stocktwits',
    'bitly', 'github', 'stackexchange', 'google', 'yahoo',
    'foursquare', 'slack', 'instagram', 'flickr', 'trello',
    'asana', 'mailchimp', 'heroku', 'dropbox', 'openstreetmap'

    // 'disqus'
  ];

  var p = req.session.provider;
  delete req.session.provider;

  var params = [];

  providers.forEach(function (provider) {
    params.push({url:'/connect/'+provider, text:provider,
      credentials: (p == provider ? req.query : null)
    });
  });
  res.render('template', {providers:params});
});

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
