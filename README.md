
# grant

_**grant**_ is build on top of **[mashape][1] / [guardian][2]**


## usage

```js
var express = require('express');

var grant = new require('grant')(require('./config/app'));

var app = express();

app.configure(function () {
  // ...
  app.use(express.cookieParser('very secret - required'));
  app.use(express.session());
  // ...
  app.use(grant);
});
```

Reserved routes for grant
```js
/connect/:provider
/step/:number
/(?:\/connect\/.*)?\/callback/
```

## configuration

- **config/credentials.json** - application credentials

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

- **config/server.js** - application server configuration

- **config/oauth.js** - provider oauth configuration

- **config/app.js** - consumer application configuration

## license
MIT

  [1]: https://www.mashape.com/
  [2]: http://guardianjs.com/
  [3]: http://oauthbible.com/
