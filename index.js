var plugin = require('./plugins/oauth_1.0a_one-legged.js'),
  key = "GgNc5gBWJHmGxGQzJ04gQZdZBQiWPfjJ",
  secret = "ix5iJwOXrfJQAnJF",
  query = require('querystring');

plugin.steps["1"]({
  method: 'post',
  url: 'http://localhost:3000/oauth/1.0a/1/request',
  next: function (error, data, res) {
    var result = query.parse(data);
    console.log(result);
  }
}, {
  echo: false,
  requestUrl: '/oauth/1.0a/1/request',
  accessUrl: '/oauth/1.0a/1/access',
  consumerKey: key,
  consumerSecret: secret
});