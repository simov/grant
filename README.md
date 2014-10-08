
# grant [![img-npm-version]][url-npm]

_**grant**_ is build on top of **[mashape][mashape] / [guardian][guardian]**


## providers [live demo][demo]

| | | | | | |
:---: | :---: | :---: | :---: | :---: | :---:
[amazon]() | [asana](http://developer.asana.com/documentation/) | [bitly](http://dev.bitly.com) | [box](https://developers.box.com/) | [digitalocean]() | [dropbox](https://www.dropbox.com/developers)
[facebook](https://developers.facebook.com) | [flickr](https://www.flickr.com/services/api/) | [foursquare](https://developer.foursquare.com/) | [github](http://developer.github.com) | [google](https://developers.google.com/) | [heroku](https://devcenter.heroku.com/categories/platform-api)
[imgur]() | [instagram](http://instagram.com/developer) | [linkedin](http://developer.linkedin.com) | [live]() | [mailchimp](http://apidocs.mailchimp.com/) | [openstreetmap](http://wiki.openstreetmap.org/wiki/API_v0.6)
[paypal]() | [slack](https://api.slack.com/) | [soundcloud](http://developers.soundcloud.com) | [stackexchange](https://api.stackexchange.com) | [stocktwits](http://stocktwits.com/developers) | [stripe]()
[trello](https://trello.com/docs/) | [tumblr]() | [twitch]() | [twitter](https://dev.twitter.com) | [vimeo]() | [yahoo](https://developer.yahoo.com/)


## usage

```js
var express = require('express');
var Grant = require('grant');

var grant = new Grant({
  server: require('./config/server.json'),
  credentials: require('./config/credentials.json'),
  options: require('./config/options.json')
});

var app = express();
// mount grant
app.use(grant);
// app server middlewares
app.use(cookieParser());
app.use(session());
```


#### reserved routes for grant

```bash
/connect/:provider
/step/:number
/connect/:provider/callback/
```


## configuration

- **example/config/server.json** - application server configuration **`required`**
  - **host** - application server host `localhost:3000` | `mydomain.com`
  - **port** - application server port `3000`
  - **protocol** - application server protocol `http` | `https`
  - **callback** - global final callback `/` | `/done` | `/callback`

- **example/config/credentials.json** - oauth application credentials **`required`**
  - **key** - `consumer_key` for _OAuth1_ or `client_id` for _OAuth2_
  - **secret** - `consumer_secret` for _OAuth1_ or `client_secret` for _OAuth2_

- **example/config/options.json** - oauth application options **`optional`**
  - **scope** - `"scope1,scope2"` or `["scope1","scope2"]`
  - **headers** - `{"User-Agent": "Grant"}`
  - **callback** - final callback for this provider _it must be different than the reserved routes for grant_


## flow

1. register application on your provider's web site
  - if your provider requires absolute `redirect` url, then it should look like this (example for github) `http://mydomain.com/connect/github/callback`
  - otherwise `http://mydomain.com` should be enough
2. set up your application `callback` in _server.json_ this is the final callback when the OAuth flow is done and this must be something different than the reserved routes for _grant_
3. optionally set specific `callback` for your provider in _options.json_ instead of using the global one specified in _server.json_


## license

MIT


  [mashape]: https://www.mashape.com/
  [guardian]: http://guardianjs.com/
  [bible]: http://oauthbible.com/
  [demo]: http://grant-oauth.herokuapp.com/
  [url-npm]: https://www.npmjs.org/package/grant

  [img-npm-version]: http://img.shields.io/npm/v/grant.svg?style=flat (NPM Version)
  [img-npm-downloads]: http://img.shields.io/npm/dm/grant.svg?style=flat (NPM Downloads)
