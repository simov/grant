
# grant

_**grant**_ is build on top of **[mashape][1] / [guardian][2]**


## usage

```js
var express = require('express');

var grant = new require('grant')(require('./config'));

var app = express();

app.configure(function () {
  // ...
  app.use(express.cookieParser('very secret - required'));
  app.use(express.session());
  // ...
  app.use(grant);
});
```


#### reserved routes for grant

```js
/connect/:provider
/step/:number
/(?:\/connect\/.*)?\/callback/
```


## configuration

- **config/server.json** - application server configuration

- **config/oauth.json** - oauth provider configuration

- **config/credentials.json** - oauth application credentials

  ```js
  {
    "facebook": {
      "key": "...",
      "secret": "..."
    },
    "twitter": {
    ...
  }
  ```

- **config/options.json** - oauth application options


## providers

[asana](http://developer.asana.com/documentation/) / [bitly](http://dev.bitly.com) / [disqus](https://disqus.com/api/docs/) / [dropbox](https://www.dropbox.com/developers) / [facebook](https://developers.facebook.com) / [flickr](https://www.flickr.com/services/api/) / [foursquare](https://developer.foursquare.com/) / [github](http://developer.github.com) / [google](https://developers.google.com/) / [heroku](https://devcenter.heroku.com/categories/platform-api) / [instagram](http://instagram.com/developer) / [linkedin](http://developer.linkedin.com) / [mailchimp](http://apidocs.mailchimp.com/) / [slack](https://api.slack.com/) / [soundcloud](http://developers.soundcloud.com) / [stackexchange](https://api.stackexchange.com) / [stocktwits](http://stocktwits.com/developers) / [trello](https://trello.com/docs/) / [twitter](https://dev.twitter.com) / [wikimapia](http://wikimapia.org/api) / [yahoo](https://developer.yahoo.com/)


## license

MIT

  [1]: https://www.mashape.com/
  [2]: http://guardianjs.com/
  [3]: http://oauthbible.com/
