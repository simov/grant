
# Grant

[![npm-version]][npm] [![coveralls-status]][coveralls]


## Providers [Playground][playground]

| | | | | | |
:---: | :---: | :---: | :---: | :---: | :---:
[500px](https://developers.500px.com/) | [amazon](http://login.amazon.com/documentation) | [asana](http://developer.asana.com/documentation/) | [bitbucket](https://confluence.atlassian.com/display/BITBUCKET/Use+the+Bitbucket+REST+APIs) | [bitly](http://dev.bitly.com) | [box](https://developers.box.com/)
[deviantart](https://www.deviantart.com/developers/) | [digitalocean](https://developers.digitalocean.com/) | [dropbox](https://www.dropbox.com/developers) | [facebook](https://developers.facebook.com) | [feedly](https://developer.feedly.com/) | [flickr](https://www.flickr.com/services/api/)
[flowdock](https://www.flowdock.com/api) | [foursquare](https://developer.foursquare.com/) | [github](http://developer.github.com) | [gitter](https://developer.gitter.im/docs/welcome) | [google](https://developers.google.com/) | [heroku](https://devcenter.heroku.com/categories/platform-api)
[imgur](https://api.imgur.com/) | [instagram](http://instagram.com/developer) | [linkedin](http://developer.linkedin.com) [(2)][quirks] | [live](http://msdn.microsoft.com/en-us/library/dn783283.aspx) | [mailchimp](http://apidocs.mailchimp.com/) | [odesk](https://developers.odesk.com/)
[openstreetmap](http://wiki.openstreetmap.org/wiki/API_v0.6) | [paypal](https://developer.paypal.com/docs/) | [redbooth](https://redbooth.com/api/) | [salesforce](https://www.salesforce.com/us/developer/docs/api_rest) | [slack](https://api.slack.com/) | [soundcloud](http://developers.soundcloud.com)
[stackexchange](https://api.stackexchange.com) | [stocktwits](http://stocktwits.com/developers) | [stripe](https://stripe.com/docs) | [trello](https://trello.com/docs/) | [tumblr](http://www.tumblr.com/docs/en/api/v2) | [twitch](https://github.com/justintv/twitch-api)
[twitter](https://dev.twitter.com) | [vimeo](https://developer.vimeo.com/) | [yahoo](https://developer.yahoo.com/) | [yammer](https://developer.yammer.com/)


## Express

```js
var express = require('express');
var Grant = require('grant').express();

var grant = new Grant({...configuration see below...});

var app = express();
// mount grant
app.use(grant);
// app server middlewares
app.use(cookieParser());
app.use(session());
```

## Koa

```js
var koa = require('koa');
var Grant = require('grant').koa();

var grant = new Grant({...configuration see below...});

var app = express();
// mount grant
app.use(mount(grant))
// app server middlewares
app.use(session(app))
app.use(bodyParser())
```


## Reserved Routes for Grant

```bash
/connect/:provider/:override?
/connect/:provider/callback
```


## Configuration

```js
{
  "server": {
    "protocol": "http",
    "host": "localhost:3000",
    "callback": "/callback"
  },
  "provider1": {
    "key": "...",
    "secret": "...",
    "scope": ["scope1", "scope2", ...],
    "state": "some state",
    "callback": "/provider1/callback"
  },
  "provider2": {...},
  ...
}
```

- **server** - configuration about your server
  - **protocol** - either `http` or `https`
  - **host** - your server's host name `localhost:3000` | `dummy.com:5000` | `mysite.com` ...
  - **callback** - common callback for all providers in your config
- **provider1** - any supported provider _(see the above table)_ `google` | `facebook` ...
  - **key** - `consumer_key` or `client_id` of your app
  - **secret** - `consumer_secret` or `client_secret` of your app
  - **scope** - OAuth scopes array
  - **state** - OAuth state string
  - **callback** - specific callback to use for this provider _(overrides the global one specified in the `server` key)_<br>
    - These callbacks are used only on your server!<br>
    - These callbacks are not the one you specify for your app!
    - You should always specify the `callback` or `redirect` url of your app like this:<br>
    `http(s)://mydomain.com/connect/[provider]/callback` where<br>
      - _provider_ is one of the above provider names
      - _mydomain.com_ is your site's domain name
  - **protocol** | **host** - additionally you can override these common values inherited from the `server` key
  - **custom1** - create sub configuration for that provider<br>
    _You can override any of the above keys here_<br>
    _**Example**_<br>
    
    ```js
    "facebook": {
      "key": "...",
      "secret": "...",
      // by default request publish permissions via /connect/facebook
      "scope": ["publish_actions", "publish_stream"],
      // set specific callback route on your server for this provider only
      "callback": "/facebook/callback"
      // custom override keys
      "groups": {
        // request only group permissions via /connect/facebook/groups
        "scope": ["user_groups", "friends_groups"]
      },
      "pages": {
        // request only page permissions via /connect/facebook/pages
        "scope": ["manage_pages"],
        // additionally use specific callback route on your server for this override only
        "callback": "/pages/callback"
      }
    }
    ```


## Dynamic Override

Additionally you can make a `POST` request to the `/connect/:provider/:override?` route to override your provider's options dynamically for each request

```js
// example using request
request.post('http://mydomain.com/connect/facebook', {
  form: {scope:['some','other','scopes']}
}, function (err, res, body) {});
```


## Return Data

The OAuth data is returned as a querystring in your _final_ callback

For OAuth the `access_token` and the `access_secret` are accessible directly, `raw` contains the raw response data

```js
{
  access_token:'...',
  access_secret:'...',
  raw:{
    oauth_token:'...',
    oauth_token_secret:'...',
    some:'other data'
  }
}
```

For OAuth2 the `access_token` and the `refresh_token` (if present) are accessible directly, `raw` contains the raw response data

```js
{
  access_token:'...',
  refresh_token:'...',
  raw:{
    access_token:'...',
    refresh_token:'...',
    some:'other data'
  }
}
```


## Typical Flow

1. Register OAuth application on your provider's web site
2. For `callback` or `redirect` url you should always use this format<br>
  `http(s)://mydomain.com/connect/[provider]/callback` where<br>
  - _provider_ is one of the above provider names
  - _mydomain.com_ is your site's domain name
3. Under the `server` key of your configuration
  - `host` - set up host to match the one used in your app's redirect url
  - `protocol` - set up protocol to match the one used in your app's redirect url
  - `callback` - set a common callback route to use on your server. This is the final callback when the OAuth flow is complete. Grant will redirect you to it after hitting the `http(s)://mydomain.com/connect/[provider]/callback` specified for your OAuth app. Therefore the `callback` value should be something different than the [reserved routes][routes] for Grant
4. Set any other provider specific configuration options under that provider key name. For example choose some `scope` to request from the user, and set specific `callback` route on your server to handle the response from that provider
5. Navigate to the `/connect/:provider/:override?` route to start the OAuth flow. Once the flow is complete, you will be redirected back to the route specified in your `callback` key. You can access the response OAuth data through the ExpressJS's `req.query` key


## Quirks

- To use LinkedIn's OAuth2 flow you should use `linkedin2` for provider name, instead of `linkedin` which is for OAuth1


## License

MIT

  [playground]: https://grant-oauth.herokuapp.com/
  [npm]: https://www.npmjs.org/package/grant
  [travis]: https://travis-ci.org/simov/grant
  [coveralls]: https://coveralls.io/r/simov/grant?branch=master

  [npm-version]: http://img.shields.io/npm/v/grant.svg?style=flat-square (NPM Version)
  [npm-downloads]: http://img.shields.io/npm/dm/grant.svg?style=flat-square (NPM Downloads)
  [travis-ci]: https://img.shields.io/travis/simov/grant/master.svg?style=flat-square (Build Status)
  [coveralls-status]: https://img.shields.io/coveralls/simov/grant.svg?style=flat-square (Coveralls Status)

  [routes]: #reserved-routes-for-grant
  [configuration]: #configuration
  [quirks]: #quirks
