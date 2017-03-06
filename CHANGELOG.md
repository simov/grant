
## Change Log

### v3.7.1 (2017/03/06)
- `Added` official support for 2 new providers

### v3.7.0 (2016/12/29)
- `Changed` dropped node 0.10 and 0.12 as built targets in TravisCI
- `Added` the advisory engines key in package.json for node >= 4.0.0
- `Added` official support for 6 new providers

### v3.6.5 (2016/09/30)
- `Fixed` add user-agent header for discogs
- `Added` official support for 1 new provider

### v3.6.4 (2016/08/30)
- `Added` support for Koa 2.x

### v3.6.3 (2016/07/27)
- `Fixed` expect oauth version to be string when passed as querystring
- `Added` official support for 1 new provider

### v3.6.2 (2016/05/17)
- `Added` custom parameter for Amazon

### v3.6.1 (2016/04/25)
- `Added` official support for 2 new providers

### v3.6.0 (2016/03/27)
- `Added` [Path Prefix](https://github.com/simov/grant#path-prefix) configuration option
- `Added` official support for 2 new providers

### v3.5.5 (2016/01/17)
- `Fixed` fix for yar@6.0.0
- `Added` official support for 2 new providers

### v3.5.4 (2015/12/28)
- `Added` official support for 11 new providers

### v3.5.3 (2015/11/28)
- `Added` official support for 8 new providers

### v3.5.2 (2015/10/30)
- `Added` OAuth2 support for [FitBit](https://github.com/simov/grant/pull/35)
- `Added` official support for 6 new providers

### v3.5.1 (2015/09/30)
- `Added` docs about [Alternative Require](https://github.com/simov/grant#alternative-require)
- `Added` official support for 6 new providers

### v3.5.0 (2015/08/30)
- `Changed` improved OAuth2 [random state string](https://github.com/simov/grant/commit/e1cf1e468846e5b2e75f65d8bdf4794a88619c37)
- `Added` ability to override the [redirect_uri](https://github.com/simov/grant#sandbox-redirect-uri)
- `Added` ability to configure Grant without having a *server* key
- `Added` generic error handler for missing or misconfigured provider
- `Added` introduced `custom_params` option for safer way to configure [custom authorization parameters](https://github.com/simov/grant#custom-parameters)
- `Added` improved documentation about all configuration [quirks](https://github.com/simov/grant#quirks)
- `Added` official support for 5 new providers

### v3.4.0 (2015/07/20)
- `Changed` improved configuration initialization
- `Changed` migrated *rdio* to [OAuth2](https://github.com/simov/grant/blob/3.4.0/config/oauth.json#L420-L424)
- `Changed` updated *trakt* [urls](https://github.com/simov/grant/blob/3.4.0/config/oauth.json#L542-L546)
- `Added` [custom_parameters](https://github.com/simov/grant/blob/3.4.0/config/oauth.json#L655) for *yandex*
- `Added` docs about the [programmatic access](https://github.com/simov/grant#programmatic-access)
- `Added` official support for 3 new providers

### v3.3.3 (2015/06/24)
- `Added` official support for 9 new providers

### v3.3.2 (2015/06/05)
- `Added` official support for 2 new providers

### v3.3.1 (2015/05/21)
- `Added` official support for 10 new providers

### v3.3.0 (2015/05/17)
- `Changed` the Express middleware is no longer using the [express-session middleware](https://github.com/simov/grant#express) internally
- `Changed` the Express and Koa middlewares are no longer using their [body-parser middleware](https://github.com/simov/grant#dynamic-override) internally
- `Changed` Express is set as peerDependency in grant-express
- `Changed` Koa is set as peerDependency in grant-koa
- `Changed` Yar is no longer set as peerDependency in grant-hapi, though using session is still required

### v3.2.0 (2015/04/23)
- `Changed` any of the [reserved keys](https://github.com/simov/grant/blob/master/config/reserved.json) can be overriden for a provider
- `Changed` allow [custom provider](https://github.com/simov/grant#custom-providers) configuration

### v3.1.0 (2015/04/14)
- `Added` transport option that allows the response data to be returned in the final callback either as querystring or in the [session](https://github.com/simov/grant/blob/master/example/session-transport/app.js)
- `Added` state:true option that enables auto generated random state string on each authorization attempt (OAuth2 only)

### v3.0.3 (2015/04/02)
- `Changed` allow any session store to be used with the [Koa middleware](https://github.com/simov/grant#koa)
- `Added` Koa [session store examples](https://github.com/simov/grant/tree/master/example/koa-session)
- `Changed` using koa-route instead of koa-router internally in the Koa middleware
- `Changed` grant-hapi now uses peerDependencies

### v3.0.2 (2015/03/17)
- `Fixed` removed default Express require left over in index.js

### v3.0.1 (2015/03/15)
- `Fixed` examples

### v3.0.0 (2015/03/15)
- `Changed` each [consumer middleware](https://github.com/simov/grant#express) now have its own module

### v2.0.1 (2015/03/02)
- `Added` Hapi middleware
- `Added` [dynamic overrides](https://github.com/simov/grant#dynamic-override) via `GET` request
- `Added` a bunch of [examples](https://github.com/simov/grant/tree/master/example)

### v2.0.0 (2015/01/06)
- Complete rewrite of the module using [request](https://github.com/request/request)
- `Added` Koa middleware
- `Changed` the [response data](https://github.com/simov/grant#response-data) format, now containing a `raw` key in it
- `Changed` [custom authorization parameters](https://github.com/simov/grant#custom-parameters) regarding token expiration are no longer part of the scope array


---


### v1.1.4 (2014/11/27)
- No longer supported, though most of the configuration data structure remains the same in the newer releases, so migration should be easy

### v1.0.0 (2014/06/22)
