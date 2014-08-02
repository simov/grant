
var Grant = require('../guardian');


describe('input params', function () {
  var server, credentials, options;

  it('/connect/:provider', function () {
    var config = {
      server: {},
      credentials: {twitter:{key:'key', secret:'secret'}},
      options: {twitter:{scope:'read'}}
    };
    (new Grant(config));
    
    config.app.twitter.consumer_key.should.equal('key');
    config.app.twitter.consumer_secret.should.equal('secret');
    config.app.twitter.scope.should.equal('read');
  });
  it('/connect/:provider?app=name', function () {
    var config = {
      server: {},
      credentials: {name:{key:'key', secret:'secret'}},
      options: {twitter:{scope:'read'}}
    };
    (new Grant(config));
    
    config.app.twitter.consumer_key.should.equal('key');
    config.app.twitter.consumer_secret.should.equal('secret');
    config.app.twitter.scope.should.equal('read');
  });
  it('/connect/:provider?app=json', function () {
    
  });
  it('/connect/:provider?app=name&options=name', function () {
    
  });
  it('/connect/:provider?app=name&options=json', function () {
    
  });
});
