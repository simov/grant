
var should = require('should');
var Grant = require('../guardian');


describe('options', function () {

  describe('shortcuts', function () {
    it('set provider shortcuts', function () {
      var config = {
        server: {},
        twitter:{}
      };
      (new Grant(config));
      config.app.twitter.twitter.should.equal(true);
      config.app.twitter.name.should.equal('twitter');
    });
  });

  describe('credentials', function () {
    it('set OAuth1 credentials', function () {
      var config = {
        server: {},
        twitter:{key:'key', secret:'secret'}
      };
      (new Grant(config));
      config.app.twitter.consumer_key.should.equal('key');
      config.app.twitter.consumer_secret.should.equal('secret');
    });
    it('set OAuth2 credentials', function () {
      var config = {
        server:{},
        facebook:{key:'key', secret:'secret'}
      };
      (new Grant(config));
      config.app.facebook.client_id.should.equal('key');
      config.app.facebook.client_secret.should.equal('secret');
    });
  });

  describe('scope', function () {
    it('join scopes with comma', function () {
      var config = {
        server:{},
        facebook:{scope:['scope1','scope2']}
      };
      (new Grant(config));
      config.app.facebook.scope.should.equal('scope1,scope2');
    });
    it('join scopes with space', function () {
      var config = {
        server:{},
        google:{scope:['scope1','scope2']}
      };
      (new Grant(config));
      config.app.google.scope.should.equal('scope1 scope2');
    });
    it('set google offline scope outside of the regular scopes', function () {
      var config = {
        server:{},
        google:{scope:['scope1','offline']}
      };
      (new Grant(config));
      config.app.google.scope.should.equal('scope1');
      config.app.google.access_type.should.equal('offline');
    });
    it('set linkedin scopes as querystring', function () {
      var config = {
        server:{},
        linkedin:{scope:['scope1','scope2']}
      };
      (new Grant(config));
      config.app.linkedin.request_url.should.equal(
        'https://api.linkedin.com/uas/oauth/requestToken?scope=scope1,scope2');
    });
  });

  describe('server', function () {
    it('set server options', function () {
      var config = {
        server: {protocol:'http', host:'localhost:3000', callback:'/'},
        facebook:{}
      };
      (new Grant(config));
      config.app.facebook.protocol.should.equal('http');
      config.app.facebook.host.should.equal('localhost:3000');
      config.app.facebook.callback.should.equal('/');
    });
    it('override server options', function () {
      var config = {
        server: {protocol:'http', host:'localhost:3000', callback:'/'},
        facebook:{protocol:'https', host:'dummy.com:3000', callback:'/callback'}
      };
      (new Grant(config));
      config.app.facebook.protocol.should.equal('https');
      config.app.facebook.host.should.equal('dummy.com:3000');
      config.app.facebook.callback.should.equal('/callback');
    });
  });

  describe('misc', function () {
    it('set OAuth2 state', function () {
      var config = {
        server:{},
        facebook:{state:'Grant'}
      };
      (new Grant(config));
      config.app.facebook.state.should.equal('Grant');
    });
    it('set headers', function () {
      var config = {
        server:{},
        facebook:{}
      };
      (new Grant(config));
      should.deepEqual(config.app.facebook.headers, {'User-Agent':'Grant'});
    });
  });

  describe('override', function () {
    it('override provider options', function () {
      var config = {
        server:{host:'dummy.com:3000'},
        facebook:{
          scope:['scope1'],
          custom:{scope:['scope2']}
        }
      };
      (new Grant(config));
      config.app.facebook.host.should.equal('dummy.com:3000');
      config.app.facebook.scope.should.equal('scope1');
      config.app.facebook.overrides.custom.host.should.equal('dummy.com:3000');
      config.app.facebook.overrides.custom.scope.should.equal('scope2');
    });
  });
});
