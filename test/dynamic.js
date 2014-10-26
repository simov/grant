
var express = require('express'),
  request = require('request'),
  extend = require('extend'),
  should = require('should');

var config = {
  server: require('../example/config/server.json'),
  credentials: require('../example/config/credentials.json'),
  options: require('../example/config/options.json')
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

describe('dynamic', function () {
  var host = 'http://localhost:5000';
  before(function (done) {
    var grant = new require('grant')(transform(config));
    var app = express()
      .use(grant)
      .listen(5000, function () {
        done();
      });
  });

  describe('get', function () {
    it('provider', function (done) {
      done();
    });
    it('override', function (done) {
      done();
    });
  });

  describe('post', function () {
    it('provider', function (done) {
      request.post(host+'/connect/google', {
        form: {
          test: true
        },
        json: true
      }, function (err, res, body) {
        if (err) return done(err);
        body.google.should.equal(true);
        done();
      });
    });
    it('override', function (done) {
      request.post(host+'/connect/google/contacts', {
        form: {
          test: true
        },
        json: true
      }, function (err, res, body) {
        if (err) return done(err);
        body.scope.should.equal('https://www.googleapis.com/auth/contacts.readonly');
        done();
      });
    });
    describe('dynamic', function () {
      it('scope', function (done) {
        request.post(host+'/connect/google', {
          form: {
            scope: ['scope1', 'scope2'],
            test: true
          },
          json: true
        }, function (err, res, body) {
          if (err) return done(err);
          body.scope.should.equal('scope1 scope2');
          should.equal(body.access_type, undefined);
          body.overrides.should.be.type('object');
          done();
        });
      });
      it('scope override', function (done) {
        request.post(host+'/connect/google/contacts', {
          form: {
            scope: ['scope1', 'scope2'],
            test: true
          },
          json: true
        }, function (err, res, body) {
          if (err) return done(err);
          body.scope.should.equal('scope1 scope2');
          should.equal(body.overrides, undefined);
          done();
        });
      });
      it('scope linkedin', function (done) {
        request.post(host+'/connect/linkedin', {
          form: {
            scope: ['scope1', 'scope2'],
            test: true
          },
          json: true
        }, function (err, res, body) {
          if (err) return done(err);
          body.request_url.should.equal(
            'https://api.linkedin.com/uas/oauth/requestToken?scope=scope1,scope2');
          done();
        });
      });
      it('state', function (done) {
        request.post(host+'/connect/google', {
          form: {
            state: 'Grant',
            test: true
          },
          json: true
        }, function (err, res, body) {
          if (err) return done(err);
          body.state.should.equal('Grant');
          done();
        });
      });
      it('credentials', function (done) {
        request.post(host+'/connect/google', {
          form: {
            key: 'key',
            secret: 'secret',
            test: true
          },
          json: true
        }, function (err, res, body) {
          if (err) return done(err);
          body.key.should.equal('key');
          body.secret.should.equal('secret');
          body.client_id.should.equal('key');
          body.client_secret.should.equal('secret');
          done();
        });
      });
      it('server', function (done) {
        request.post(host+'/connect/google', {
          form: {
            protocol: 'https',
            host: 'dummy.com',
            callback: '/test/callback',
            test: true
          },
          json: true
        }, function (err, res, body) {
          if (err) return done(err);
          body.protocol.should.equal('https');
          body.host.should.equal('dummy.com');
          body.callback.should.equal('/test/callback');
          done();
        });
      });
    });
  });
});
