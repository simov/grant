var Express = require('express'),
    Log = require('log'),
    Server = require('./lib/index'),
    Moth = require('mashape-oauth'),
    OAuth = Moth.OAuth,
    OAuth2 = Moth.OAuth2,
    utils = Moth.utils;

var config = require ('./config.js'),
    log = new Log(config.environment.level);

var app = Express();

app.configure(function () {
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/_views');
  app.use(Express.static(__dirname + '/_assets'));
  app.use(Express.bodyParser());
  app.use(Express.cookieParser('maeby, lets keep it a secret?'));
  app.use(Express.session());
});

app.post('/oauth/1.0a/:leg/:action', function (req, res) {
  var leg = req.params.leg, action = req.params.action, request;

  // log.info('leg: ' + leg);
  // log.info('action: ' + action);
  // log.info('headers: ' + JSON.stringify(utils.parseHeader(req.headers.authorization)));

  try {
    request = Server.OAuth.Flows.One(req);
    log.info(request.signature.getBase());
  } catch (e) {
    log.error(e);
  }

  res.send('client_token=hello_world&client_secret=whatever&body=this');
});

app.listen(config.port);