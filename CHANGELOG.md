
# Change Log

## v3.8.0 (2017/06/07)
- **Change:** Hapi is now using the internal `config` object directly through the middleware instance
- **Fix:** Dynamic overrides support for Hapi >= 12.x
- **New:** Hapi middleware configuration can be passed in the constructor
- **New:** First class support for Koa >= 2.x using `async`/`await` **Node 8.0.0 required!**
  - Koa 1.x and 0.x are still supported for Node 4, 6 and 8

## v3.7.2 (2017/04/20)
- **Change:** Removed 2 discontinued providers: `beatsmusic` and `copy`
- **New:** Official support for 5 new providers: `ebay`, `genius`, `jamendo`, `pinterest` and `unsplash`

## v3.7.1 (2017/03/06)
- **New:** Official support for 2 new providers: `discord` and `medium`

## v3.7.0 (2016/12/29)
- **Change:** Dropped node `0.10` and `0.12` as built targets in TravisCI
- **Change:** Added the advisory engines key in package.json for node `>=4.0.0`
- **New:** Official support for 6 new providers: `baidu`, `docusign`, `iconfinder`, `idme`, `mydigipass`, `venmo`

## v3.6.5 (2016/09/30)
- **Fix:** Added the required `user-agent` header for `discogs`
- **New:** Official support for 1 new provider: `homeaway`

## v3.6.4 (2016/08/30)
- **New:** Support for Koa 2.x

## v3.6.3 (2016/07/27)
- **Fix:** Expect oauth version to be string when passed as querystring
- **New:** Official support for 1 new provider: `lyft`

## v3.6.2 (2016/05/17)
- **New:** Added `scope_data` custom parameter for `amazon`

## v3.6.1 (2016/04/25)
- **New:** Official support for 2 new providers: `idonthis`, `smugmug`

## v3.6.0 (2016/03/27)
- **New:** [Path Prefix](https://github.com/simov/grant#path-prefix) configuration option
- **New:** Official support for 2 new providers: `microsoft`, `visualstudio`

## v3.5.5 (2016/01/17)
- **Fix:** Fix for `yar@6.0.0`
- **New:** Official support for 2 new providers: `gitbook`, `optimizely`

## v3.5.4 (2015/12/28)
- **New:** Official support for 11 new providers

## v3.5.3 (2015/11/28)
- **New:** Official support for 8 new providers

## v3.5.2 (2015/10/30)
- **New:** OAuth2 support for `fitbit2`
- **New:** Official support for 6 new providers

## v3.5.1 (2015/09/30)
- **New:** Docs about the [Alternative Require](https://github.com/simov/grant#alternative-require)
- **New:** Official support for 6 new providers

## v3.5.0 (2015/08/30)
- **Change:** Improved OAuth2 [random state string](https://github.com/simov/grant/commit/e1cf1e468846e5b2e75f65d8bdf4794a88619c37)
- **New:** Ability to override the [redirect_uri](https://github.com/simov/grant#sandbox-redirect-uri)
- **New:** Ability to configure Grant without having a `server` configuration key
- **New:** Generic error handler for missing or misconfigured provider
- **New:** Introduced `custom_params` option for safer way to configure [Custom Authorization Parameters](https://github.com/simov/grant#custom-parameters)
- **New:** Improved documentation about all configuration [Quirks](https://github.com/simov/grant#quirks)
- **New:** Official support for 5 new providers

## v3.4.0 (2015/07/20)
- **Change:** Improved configuration initialization
- **Change:** Migrated `rdio` to OAuth2
- **Change:** Updated `trakt` OAuth URLs
- **New:** Added `device_id` and `device_name` custom authorization parameters for `yandex`
- **New:** Docs about the [Programmatic Access](https://github.com/simov/grant#programmatic-access)
- **New:** Official support for 3 new providers

## v3.3.3 (2015/06/24)
- **New:** Official support for 9 new providers

## v3.3.2 (2015/06/05)
- **New:** Official support for 2 new providers

## v3.3.1 (2015/05/21)
- **New:** Official support for 10 new providers

## v3.3.0 (2015/05/17)
- **Change:** The Express middleware is no longer using the [express-session middleware](https://github.com/simov/grant#express) internally
- **Change:** The Express and Koa middlewares are no longer using their [body-parser middleware](https://github.com/simov/grant#dynamic-override) internally
- **Change:** Express is set as `peerDependency` in `grant-express`
- **Change:** Koa is set as `peerDependency` in `grant-koa`
- **Change:** Yar is no longer set as `peerDependency` in `grant-hapi`, though using session is still required

## v3.2.0 (2015/04/23)
- **Change:** Any of the [reserved keys](https://github.com/simov/grant/blob/master/config/reserved.json) can be overriden for a provider
- **Change:** Allow [Custom Provider](https://github.com/simov/grant#custom-providers) configuration

## v3.1.0 (2015/04/14)
- **New:** `transport` option that allows the response data to be returned in the final callback either as querystring or in the [session](https://github.com/simov/grant/blob/master/example/session-transport/app.js)
- **New:** `state: true` option that enables auto generated random state string on each authorization attempt (OAuth2 only)

## v3.0.3 (2015/04/02)
- **Change:** Allow [any session store](https://github.com/simov/grant/tree/master/examples/koa-session) to be used with the Koa middleware
- **Change:** Using `koa-route` instead of `koa-router` internally in the Koa middleware
- **Change:** `grant-hapi` now uses `peerDependencies`

## v3.0.2 (2015/03/17)
- **Fix:** Removed default Express require left over in index.js

## v3.0.1 (2015/03/15)
- **Fix:** Examples

## v3.0.0 (2015/03/15)
- **Change:** Each [consumer middleware](https://github.com/simov/grant#express) now have its own module: `grant-express`, `grant-koa` and `grant-hapi`

## v2.0.1 (2015/03/02)
- **New:** Hapi middleware
- **New:** Docs about [Dynamic Overrides](https://github.com/simov/grant#dynamic-override) via `GET` request
- **New:** A bunch of [Examples](https://github.com/simov/grant/tree/master/examples)

## v2.0.0 (2015/01/06)
- **Change:** Complete rewrite of the module using [request](https://github.com/request/request)
- **New:** Koa middleware
- **Change:** The [Response Data](https://github.com/simov/grant#response-data) now contains a `raw` key in it
- **Change:** [Custom Authorization Parameters](https://github.com/simov/grant#custom-parameters) regarding token expiration are no longer part of the scope array


---


## v1.1.4 (2014/11/27)
- Version `1.x` is no longer supported, though most of the configuration data structure remains intact, so migration should be easy

## v1.0.0 (2014/06/22)
- Initial Release
