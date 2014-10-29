
var express = require('express'),
  request = require('request'),
  should = require('should');


describe('route', function () {
  var host = 'http://localhost:5000';
  var fixture = {
    server: {},
    facebook: {
      scope:['scope1'],
      callback:'/callback',
      custom: {
        scope:['scope2']
      }
    }
  };
  before(function (done) {
    var grant = new require('grant')(fixture);
    var app = express()
      .use(grant)
      .listen(5000, function () {
        done();
      });
  });

  it('provider', function (done) {
    request.get(host+'/connect/facebook', {
      qs: {test: true},
      json: true
    }, function (err, res, provider) {
      if (err) return done(err);
      provider.scope.should.equal('scope1');
      provider.callback.should.equal('/callback');
      done();
    });
  });

  it('override', function (done) {
    request.get(host+'/connect/facebook/custom', {
      qs: {test: true},
      json: true
    }, function (err, res, provider) {
      if (err) return done(err);
      provider.scope.should.equal('scope2');
      provider.callback.should.equal('/callback');
      done();
    });
  });

  it('provider dynamic', function (done) {
    request.post(host+'/connect/facebook', {
      form: {test: true, scope:['scope3','scope4']},
      json: true
    }, function (err, res, provider) {
      if (err) return done(err);
      provider.scope.should.equal('scope3,scope4');
      provider.callback.should.equal('/callback');
      done();
    });
  });

  it('override dynamic', function (done) {
    request.post(host+'/connect/facebook/custom', {
      form: {test: true, callback:'/custom'},
      json: true
    }, function (err, res, provider) {
      if (err) return done(err);
      // console.log(provider);
      provider.scope.should.equal('scope2');
      provider.callback.should.equal('/custom');
      done();
    });
  });
});
