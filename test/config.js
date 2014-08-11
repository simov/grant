
var should = require('should');
var Grant = require('../guardian');


describe('options', function () {
  it('set oauth1 credentials', function () {
    var config = {
      credentials: {twitter:{key:'key', secret:'secret'}}
    };
    (new Grant(config));
    config.app.twitter.consumer_key.should.equal('key');
    config.app.twitter.consumer_secret.should.equal('secret');
  });
  it('set oauth2 credentials', function () {
    var config = {
      credentials: {facebook:{key:'key', secret:'secret'}}
    };
    (new Grant(config));
    config.app.facebook.client_id.should.equal('key');
    config.app.facebook.client_secret.should.equal('secret');
  });
  it('use server final callback', function () {
    var config = {
      server: {callback:'/callback'},
      options: {facebook:{}}
    };
    (new Grant(config));
    config.app.facebook.callback.should.equal('/callback');
  });
  it('set specific final callback', function () {
    var config = {
      server: {callback:'/callback'},
      options: {facebook:{callback:'/facebook/callback'}}
    };
    (new Grant(config));
    config.app.facebook.callback.should.equal('/facebook/callback');
  });
  it('set scope as string', function () {
    var config = {
      options: {facebook:{scope:'scope1,scope2'}}
    };
    (new Grant(config));
    config.app.facebook.scope.should.equal('scope1,scope2');
  });
  it('set scope as array', function () {
    var config = {
      options: {facebook:{scope:['scope1','scope2']}}
    };
    (new Grant(config));
    config.app.facebook.scope.should.equal('scope1,scope2');
  });
  it('set scope as array - google', function () {
    var config = {
      options: {google:{scope:['scope1','scope2']}}
    };
    (new Grant(config));
    config.app.google.scope.should.equal('scope1 scope2');
  });
  it('set custom headers', function () {
    var config = {
      options: {github:{headers:{'User-Agent':'Purest'}}}
    };
    (new Grant(config));
    should.deepEqual(config.app.github.headers, {'User-Agent':'Purest'});
  });
  it('set linkedin scope inside the querystring', function () {
    var config = {
      options: {linkedin:{scope:['scope1','scope2']}}
    };
    (new Grant(config));
    config.app.linkedin.request_url.should.equal(
      'https://api.linkedin.com/uas/oauth/requestToken?scope=scope1,scope2');
  });
});
