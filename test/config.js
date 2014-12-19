
var should = require('should');
var config = require('../lib/config');


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

  describe('dynamic', function () {
    it('no options to override', function () {
      var provider = {scope:['scope1'], callback:'/'};
      var options = {scope:'', callback:null};
      var dynamic = config.dynamic(provider, options);
      should.deepEqual(provider, {scope:['scope1'], callback:'/'});
      should.deepEqual(dynamic, {scope:'scope1', callback:'/'});
    });
    it('override', function () {
      var provider = {scope:['scope1'], callback:'/'};
      var options = {scope:['scope1','scope2']};
      var dynamic = config.dynamic(provider, options);
      should.deepEqual(provider, {scope:['scope1'], callback:'/'});
      should.deepEqual(dynamic, {scope:'scope1,scope2', callback:'/'});
    });
  });

  describe('init', function () {
    it('shortcuts', function () {
      var options = {server:{}, facebook:{key:'key',secret:'secret'}};
      var cfg = config.init(options);
      cfg.facebook.facebook.should.equal(true);
      cfg.facebook.name.should.equal('facebook');
      cfg.facebook.key.should.equal('key');
      cfg.facebook.secret.should.equal('secret');
    });
    it('server config', function () {
      var options = {server:{protocol:'http', host:'localhost:3000', callback:'/'}};
      var cfg = config.init(options);
      cfg.facebook.protocol.should.equal('http');
      cfg.facebook.host.should.equal('localhost:3000');
      cfg.facebook.callback.should.equal('/');
    });
    it('server config', function () {
      var options = {
        server:{protocol:'http', host:'localhost:3000', callback:'/'},
        facebook:{protocol:'https', host:'dummy.com:3000', callback:'/callback'}
      };
      var cfg = config.init(options);
      cfg.facebook.protocol.should.equal('https');
      cfg.facebook.host.should.equal('dummy.com:3000');
      cfg.facebook.callback.should.equal('/callback');
    });

    describe('overrides', function () {
      it('override provider options', function () {
        var options = {server:{}, facebook:{
          scope:['scope1'], callback:'/callback', custom:{scope:['scope2']}}
        };
        var cfg = config.init(options);
        cfg.facebook.scope.should.equal('scope1');
        cfg.facebook.callback.should.equal('/callback');
        cfg.facebook.overrides.should.be.type('object');
        cfg.facebook.overrides.custom.scope.should.equal('scope2');
        cfg.facebook.overrides.custom.callback.should.equal('/callback');
      });
    });
  });
});
