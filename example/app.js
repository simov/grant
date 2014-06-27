
var express = require('express'),
    hogan = require('hogan.js'),
    consolidate = require('consolidate');


var grant = new require('grant')(require('../config/app'));


var app = express();

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname);
  app.set('view engine', 'html');
  // app.set('view cache', true);
  app.engine('html', consolidate.hogan);

  app.use(express.cookieParser('very secret - required'));
  app.use(express.session());
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(grant);
});


app.get('/', function (req, res) {
  console.log(req.query);

  var providers = [
    'twitter', 'facebook', 'linkedin', 'soundcloud', 'stocktwits',
    'bitly', 'github', 'stackexchange', 'google', 'yahoo',
    'foursquare', 'slack', 'instagram', 'flickr', 'trello',
    'asana'

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
