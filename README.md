
# grant

_**grant**_ is build on top of **[mashape][1] / [guardian][2]**


## usage

```js
var express = require('express');

var grant = new require('grant')({
  server: require('./config/server.json'),
  credentials: require('./config/credentials.json'),
  options: require('./config/options.json')
});

var app = express();

app.configure(function () {
  // ...
  app.use(express.cookieParser('very secret'));
  app.use(express.session());
  // ...
  app.use(grant);
});
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


## providers
| | | | | | |
:---: | :---: | :---: | :---: | :---: | :---:
[asana](http://developer.asana.com/documentation/) | [bitly](http://dev.bitly.com) | [dropbox](https://www.dropbox.com/developers) | [facebook](https://developers.facebook.com) | [flickr](https://www.flickr.com/services/api/) | [foursquare](https://developer.foursquare.com/)
[github](http://developer.github.com) | [google](https://developers.google.com/) | [heroku](https://devcenter.heroku.com/categories/platform-api) | [instagram](http://instagram.com/developer) | [linkedin](http://developer.linkedin.com) | [mailchimp](http://apidocs.mailchimp.com/)
[openstreetmap](http://wiki.openstreetmap.org/wiki/API_v0.6) | [slack](https://api.slack.com/) | [soundcloud](http://developers.soundcloud.com) | [stackexchange](https://api.stackexchange.com) | [stocktwits](http://stocktwits.com/developers) | [trello](https://trello.com/docs/)
[twitter](https://dev.twitter.com) | [wikimapia](http://wikimapia.org/api) | [yahoo](https://developer.yahoo.com/)


## flow
1. register application on your provider's web site
  - if your provider requires absolute `redirect` url, then it should look like this (example for github) `http://mydomain.com/connect/github/callback`
  - otherwise `http://mydomain.com` should be enough
2. set up your application `callback` in _server.json_ this is the final callback when the OAuth flow is done and this must be something different than the reserved routes for _grant_
3. optionally set specific `callback` for your provider in _options.json_ instead of using the global one specified in _server.json_

## license

MIT

  [1]: https://www.mashape.com/
  [2]: http://guardianjs.com/
  [3]: http://oauthbible.com/
