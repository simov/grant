
var request = require('supertest');
var express = require('express');


describe('callback', function () {
  var app;

  before(function () {
    var config = {
      server:{callback:'/done'},
      options:{facebook:{}, github:{callback:'/github/done'}}
    };

    var grant = express();
    grant.get('/connect/:provider', function (req, res) {
      debugger;
      req.session.provider = req.params.provider;
      res.redirect('/connect/'+req.params.provider+'/callback');
    });
    grant.get('/connect/:provider/callback', function (req, res) {
      debugger;
      res.redirect(config.options[req.params.provider].callback||config.server.callback);
    });

    app = express();
    app.use(express.cookieParser('very secret'));
    app.use(express.session());
    app.use(express.bodyParser());
    app.use(grant);
    app.get('/done', function (req, res) {
      debugger;
      res.writeHead(200, {'content-type': 'application/json'});
      res.end(JSON.stringify({
        message:'Server global final callback called for '+req.session.provider
      }));
    });
    app.get('/github/done', function (req, res) {
      debugger;
      res.writeHead(200, {'content-type': 'application/json'});
      res.end(JSON.stringify({
        message:'Provider specific final callback called for github'
      }));
    });
  });

  it('use default server.callback', function (done) {
    request(app)
      .get('/connect/facebook')
      .redirects(2)
      .end(function (err, res) {
        debugger;
        // session isn't stored with supertest for some reason, but you get the point
        res.body.message.should.equal('Server global final callback called for facebook');
        done();
      });
  });
  it('use specific provider.callback', function (done) {
    request(app)
      .get('/connect/github')
      .redirects(2)
      .end(function (err, res) {
        debugger;
        res.body.message.should.equal('Provider specific final callback called for github');
        done();
      });
  });
});
