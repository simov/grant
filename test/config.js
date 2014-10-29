
var should = require('should');
var config = require('../config');


describe('options', function () {

  describe('credentials', function () {
    it('OAuth1 through config', function () {
      var provider = {auth_version:1, key:'key', secret:'secret'};
      var options = {};
      config.credentials(provider, options);
      provider.consumer_key.should.equal('key');
      provider.consumer_secret.should.equal('secret');
    });
    it('OAuth1 through override', function () {
      var provider = {auth_version:1, key:'key', secret:'secret'};
      var options = {key:'key2', secret:'secret2'};
      config.credentials(provider, options);
      provider.consumer_key.should.equal('key2');
      provider.consumer_secret.should.equal('secret2');
    });
    it('OAuth2 through config', function () {
      var provider = {auth_version:2, key:'key', secret:'secret'};
      var options = {};
      config.credentials(provider, options);
      provider.client_id.should.equal('key');
      provider.client_secret.should.equal('secret');
    });
    it('OAuth2 through override', function () {
      var provider = {auth_version:2, key:'key', secret:'secret'};
      var options = {key:'key2', secret:'secret2'};
      config.credentials(provider, options);
      provider.client_id.should.equal('key2');
      provider.client_secret.should.equal('secret2');
    });
  });

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
    it('set google offline scope outside of the regular scopes', function () {
      var provider = {google:true};
      var options = {scope:['scope1','offline']};
      config.scope(provider, options);
      provider.scope.should.equal('scope1');
      provider.access_type.should.equal('offline');
    });
    it('remove google offline scope on override', function () {
      var provider = {google:true, access_type:'offline'};
      var options = {scope:['scope1']};
      config.scope(provider, options);
      provider.scope.should.equal('scope1');
      should.equal(provider.access_type, undefined);
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
    it('misc', function () {
      var options = {server:{}, facebook:{state:'Grant'}};
      var cfg = config.init(options);
      cfg.app.facebook.state.should.equal('Grant');
      should.deepEqual(cfg.app.facebook.headers, {'User-Agent': 'Grant'});
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
