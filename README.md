
# Grant

[![npm-version]][npm] [![coveralls-status]][coveralls]


## 82 Supported Providers / [OAuth Playground][playground]

[`500px`](https://developers.500px.com/) | [`amazon`](http://login.amazon.com/documentation) | [`angellist`](https://angel.co/api) | [`appnet`](https://developers.app.net/reference/resources/) | [`asana`](http://developer.asana.com/documentation/) | [`assembla`](http://api-doc.assembla.com/) | [`basecamp`](https://github.com/basecamp/bcx-api/) | [`bitbucket`](https://confluence.atlassian.com/display/BITBUCKET) | [`bitly`](http://dev.bitly.com) | [`box`](https://developers.box.com/) | [`buffer`](http://dev.buffer.com) | [`cheddar`](https://cheddarapp.com/developer/) | [`coinbase`](https://www.coinbase.com/docs/api/overview) | [`dailymile`](http://www.dailymile.com/api/documentation) | [`dailymotion`](https://developer.dailymotion.com/documentation#graph-api) | [`deezer`](http://developers.deezer.com/) | [`deviantart`](https://www.deviantart.com/developers/) | [`digitalocean`](https://developers.digitalocean.com/) | [`disqus`](https://disqus.com/api/docs/) | [`dropbox`](https://www.dropbox.com/developers) | [`eventbrite`](http://developer.eventbrite.com/) | [`evernote`](https://dev.evernote.com/doc/) | [`everyplay`](https://developers.everyplay.com/) | [`eyeem`](https://www.eyeem.com/developers) | [`facebook`](https://developers.facebook.com) | [`feedly`](https://developer.feedly.com/) | [`fitbit`](http://dev.fitbit.com/) | [`flattr`](http://developers.flattr.net/) | [`flickr`](https://www.flickr.com/services/api/) | [`flowdock`](https://www.flowdock.com/api) | [`foursquare`](https://developer.foursquare.com/) | [`geeklist`](http://hackers.geekli.st/) | [`getpocket`](http://getpocket.com/developer/) | [`github`](http://developer.github.com) | [`gitter`](https://developer.gitter.im/docs/welcome) | [`goodreads`](https://www.goodreads.com/api) | [`google`](https://developers.google.com/) | [`harvest`](https://github.com/harvesthq/api) | [`heroku`](https://devcenter.heroku.com/categories/platform-api) | [`imgur`](https://api.imgur.com/) | [`instagram`](http://instagram.com/developer) | [`jawbone`](https://jawbone.com/up/developer/) | [`linkedin`](http://developer.linkedin.com) | [`live`](http://msdn.microsoft.com/en-us/library/dn783283.aspx) | [`mailchimp`](http://apidocs.mailchimp.com/) | [`meetup`](http://www.meetup.com/meetup_api/) | [`mixcloud`](http://www.mixcloud.com/developers/) | [`odesk`](https://developers.odesk.com) | [`openstreetmap`](http://wiki.openstreetmap.org/wiki/API_v0.6) | [`paypal`](https://developer.paypal.com/docs/) | [`podio`](https://developers.podio.com/) | [`rdio`](http://www.rdio.com/developers/) | [`redbooth`](https://redbooth.com/api/) | [`reddit`](http://www.reddit.com/dev/api) | [`runkeeper`](http://developer.runkeeper.com/healthgraph/overview) | [`salesforce`](https://www.salesforce.com/us/developer/docs/api_rest) | [`shopify`](http://docs.shopify.com/api) | [`skyrock`](http://www.skyrock.com/developer/documentation/) | [`slack`](https://api.slack.com/) | [`slice`](https://developer.slice.com/) | [`soundcloud`](http://developers.soundcloud.com) | [`spotify`](https://developer.spotify.com) | [`stackexchange`](https://api.stackexchange.com) | [`stocktwits`](http://stocktwits.com/developers) | [`strava`](http://strava.github.io/api/) | [`stripe`](https://stripe.com/docs) | [`traxo`](https://developer.traxo.com/) | [`trello`](https://trello.com/docs/) | [`tripit`](https://www.tripit.com/developer) | [`tumblr`](http://www.tumblr.com/docs/en/api/v2) | [`twitch`](https://github.com/justintv/twitch-api) | [`twitter`](https://dev.twitter.com) | [`uber`](https://developer.uber.com/v1/api-reference/) | [`vimeo`](https://developer.vimeo.com/) | [`vk`](http://vk.com/dev) | [`withings`](http://oauth.withings.com/api) | [`wordpress`](https://developer.wordpress.com/docs/api/) | [`xing`](https://dev.xing.com/docs) | [`yahoo`](https://developer.yahoo.com/) | [`yammer`](https://developer.yammer.com/) | [`yandex`](http://api.yandex.com/) | [`zendesk`](https://developer.zendesk.com/rest_api/docs/core/introduction)


## Express

```js
var express = require('express')
var Grant = require('grant').express()

var grant = new Grant({...configuration see below...})

var app = express()
// mount grant
app.use(grant)
// app server middlewares
app.use(cookieParser())
app.use(session())
```


## Koa

```js
var koa = require('koa')
var Grant = require('grant').koa()

var grant = new Grant({...configuration see below...})

var app = koa()
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
  - **callback** - common callback for all providers in your config `/callback` | `/done` ...
- **provider1** - any supported provider _(see the list above)_ `facebook` | `twitter` ...
  - **key** - `consumer_key` or `client_id` of your app
  - **secret** - `consumer_secret` or `client_secret` of your app
  - **scope** - array of OAuth scopes to request
  - **state** - OAuth state string to pass
  - **callback** - specific callback to use for this provider _(overrides the global one specified under the `server` key)_


## Redirect Url

For `callback/redirect` url of your OAuth application you should **always** use this format

`[protocol]://[host]/connect/[provider]/callback`

Where `protocol` and `host` should match the ones from which you initiate the flow, and `provider` is the provider's name from the list of supported providers

The path you specify in the `callback` key in the Grant's configuration is where you'll receive the response data from the OAuth flow as a querystring, **after** the `[protocol]://[host]/connect/[provider]/callback` route was hit


## Static Overrides

You can add arbitrary keys inside your provider's configuration to create sub configurations that overrides the _global_ settings for that provider

```js
// navigate to /connect/facebook
"facebook": {
  "key": "...",
  "secret": "...",
  // by default request publish permissions
  "scope": ["publish_actions", "publish_stream"],
  // set specific callback route on your server for this provider only
  "callback": "/facebook/callback"
  // navigate to /connect/facebook/groups
  "groups": {
    // request only group permissions
    "scope": ["user_groups", "friends_groups"]
  },
  // navigate to /connect/facebook/pages
  "pages": {
    // request only page permissions
    "scope": ["manage_pages"],
    // additionally use specific callback route on your server for this override only
    "callback": "/pages/callback"
  }
}
```


## Dynamic Override

Additionally you can make a `POST` request to the `/connect/:provider/:override?` route to override your provider's configuration dynamically on each request

```html
<form action="/connect/facebook" method="post" accept-charset="utf-8">
  <input name="state" type="text" value="" />
  <input name="scope" type="checkbox" value="read" />
  <input name="scope" type="checkbox" value="write" />
  <button>submit</button>
</form>
```


## Quirks

- To use LinkedIn's OAuth2 flow you should use `linkedin2` for provider name, instead of `linkedin` which is for OAuth1
- For Zendesk and Shopify you should specify your company's sub domain name through the `subdomain` option
- Some providers may employ custom authorization parameters outside of the ones specified in the [configuration][configuration] section. You can pass those custom parameters directly in your configuration, for example: Google - `access_type`, Reddit - `duration`, Trello - `expiration`, and so on. Refer to the provider's OAuth documentation for more details


## Response Data

The OAuth data is returned as a querystring in your **final** callback _(the one you specify in the `callback` key of your Grant configuration)_


#### OAuth1

For OAuth1 the `access_token` and the `access_secret` are accessible directly, `raw` contains the raw response data

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


#### OAuth2

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


#### Error

In case of an error, the `error` key will be populated with the raw error data

```js
{
  error:{
    some:'error data'
  }
}
```


## Typical Flow

1. Register OAuth application on your provider's web site
2. For `callback/redirect` url **always** use this format
  `[protocol]://[host]/connect/[provider]/callback`
3. Create a `config.json` file containig
  ```js
  "server": {
    "protocol": "https",
    "host": "mywebsite.com",
    "callback": "/handle_oauth_response"
  },
  "facebook": {
    "key": "client_id",
    "secret": "client_secret",
    "scope": ["user_about_me"]
  },
  "twitter": {
    "key": "consumer_key",
    "secret": "consumer_secret",
    "callback": "/handle_twitter_response"
  }
  ```
4. Initialize Grant and mount it
  ```js
  // express
  var express = require('express')
  var Grant = require('grant').express()
  var grant = new Grant(require('./config.json'))
  var app = express()
  app.use(grant)
  // koa
  var koa = require('koa')
  var Grant = require('grant').koa()
  var grant = new Grant(require('./config.json'))
  var app = koa()
  app.use(mount(grant))
  ```
5. Navigate to `/connect/facebook` to initiate the OAuth flow for Facebook, or navigate to `/connect/twitter` to initiate the OAuth flow for Twitter
6. Once the OAuth flow is complete for Facebook you'll receive the response data as a querystring in the `/handle_oauth_response` route, and for Twitter in the `/handle_twitter_response` route


## What's Next

Once you have your access tokens secured, you can start making authorized requests on behalf of your users. _**[Purest][purest]**_ is a great REST API library that supports **dozens** of REST API providers


## License

MIT

  [playground]: https://grant-oauth.herokuapp.com/
  [purest]: https://github.com/simov/purest
  [request]: https://github.com/request/request

  [npm]: https://www.npmjs.org/package/grant
  [travis]: https://travis-ci.org/simov/grant
  [coveralls]: https://coveralls.io/r/simov/grant?branch=master

  [npm-version]: http://img.shields.io/npm/v/grant.svg?style=flat-square (NPM Version)
  [npm-downloads]: http://img.shields.io/npm/dm/grant.svg?style=flat-square (NPM Downloads)
  [travis-ci]: https://img.shields.io/travis/simov/grant/master.svg?style=flat-square (Build Status)
  [coveralls-status]: https://img.shields.io/coveralls/simov/grant.svg?style=flat-square (Coveralls Status)

  [express-example]: https://github.com/simov/grant/blob/master/example/express.js
  [koa-example]: https://github.com/simov/grant/blob/master/example/koa.js

  [routes]: #reserved-routes-for-grant
  [configuration]: #configuration
  [quirks]: #quirks
