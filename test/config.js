
var should = require('should');
var config = require('../config');


describe('options', function () {

  describe('scope', function () {
    it('array with comma', function () {
      var provider = {};
      var options = {scope:['scope1','scope2']};
      config.scope(provider, options);
      provider.scope.should.equal('scope1,scope2');
    });
    it('array with delimiter', function () {
      var provider = {scope_delimiter:' '};
      var options = {scope:['scope1','scope2']};
      config.scope(provider, options);
      provider.scope.should.equal('scope1 scope2');
    });
    it('string', function () {
      var provider = {};
      var options = {scope:'scope1,scope2'};
      config.scope(provider, options);
      provider.scope.should.equal('scope1,scope2');
    });
    it('set linkedin scopes as querystring', function () {
      var provider = {linkedin:true, request_url:'https://requestToken'};
      var options = {scope:['scope1','scope2']};
      config.scope(provider, options);
      provider.request_url.should.equal('https://requestToken?scope=scope1,scope2');
    });
  });

  describe('override', function () {
    it('dcopy', function () {
      var provider = {scope:['scope1'], callback:'/'};
      var options = {scope:['scope1','scope2']};
      var copy = config.override(provider, options);
      should.deepEqual(provider, {scope:['scope1'], callback:'/'});
      should.deepEqual(copy, {scope:['scope1','scope2'], callback:'/'});
    });
  });

  describe('init', function () {
    it('shortcuts', function () {
      var options = {server:{}, facebook:{key:'key',secret:'secret'}};
      var cfg = config.init(options);
      cfg.app.facebook.facebook.should.equal(true);
      cfg.app.facebook.name.should.equal('facebook');
      cfg.app.facebook.key.should.equal('key');
      cfg.app.facebook.secret.should.equal('secret');
    });
    it('server config', function () {
      var options = {server:{protocol:'http', host:'localhost:3000', callback:'/'}};
      var cfg = config.init(options);
      cfg.app.facebook.protocol.should.equal('http');
      cfg.app.facebook.host.should.equal('localhost:3000');
      cfg.app.facebook.callback.should.equal('/');
    });
    it('server config', function () {
      var options = {
        server:{protocol:'http', host:'localhost:3000', callback:'/'},
        facebook:{protocol:'https', host:'dummy.com:3000', callback:'/callback'}
      };
      var cfg = config.init(options);
      cfg.app.facebook.protocol.should.equal('https');
      cfg.app.facebook.host.should.equal('dummy.com:3000');
      cfg.app.facebook.callback.should.equal('/callback');
    });

    describe('overrides', function () {
      it('override provider options', function () {
        var options = {server:{}, facebook:{
          scope:['scope1'], callback:'/callback', custom:{scope:['scope2']}}
        };
        var cfg = config.init(options);
        cfg.app.facebook.scope.should.equal('scope1');
        cfg.app.facebook.callback.should.equal('/callback');
        cfg.app.facebook.overrides.should.be.type('object');
        cfg.app.facebook.overrides.custom.scope.should.equal('scope2');
        cfg.app.facebook.overrides.custom.callback.should.equal('/callback');
      });
    });
  });
});
