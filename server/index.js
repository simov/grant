var Express = require('express'),
    Log = require('log'),
    Moth = require('mashape-oauth'),
    OAuth = Moth.OAuth,
    OAuth2 = Moth.OAuth2;

var config = require ('./config.js'),
    log = new Log(config.environment.level);

var app = Express();

app.configure(function () {
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/_views');
  app.use(express.static(__dirname + '/_assets'));
  app.use(express.bodyParser());
  app.use(express.cookieParser('maeby, lets keep it a secret?'));
  app.use(express.session());
});

app.get('/oauth/:version/:leg/:action', function (req, res) {
  var version = req.params.version,
      leg = req.params.leg,
      action = req.params.action;

  log.info('Version: ' + version);
  log.info('Leg: ' + leg);
  log.info('Action: ' + action);
});

app.listen(config.port);