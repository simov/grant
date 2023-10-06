
# Change Log

## v5.4.22 (2023/10/06)
- **New:** Official support for 2 new providers: `osu`, `workos`
- **Change:** Updated 2 providers: `autodesk`, `withings`
- **Change:** Removed 2 discontinued providers: `flattr`, `flowdock`

## v5.4.21 (2022/03/09)
- **New:** Official support for 2 new providers: `authing`, `tiktok`
- **New:** Official support for Twitter OAuth 1.0a `x_auth_access_type` custom scope parameter: [quirks](https://github.com/simov/grant#provider-quirks)

## v5.4.20 (2022/01/23)
- **New:** Official support for Twitter OAuth 2.0 apps: `twitter2` [quirks](https://github.com/simov/grant#provider-quirks)
- **Change:** Updated 1 provider: `google` id_token `iss: accounts.google.com -> https://accounts.google.com`

## v5.4.19 (2022/01/03)
- **New:** Official support for 1 new provider: `surveysparrow`
- **Fix:** Vercel handler cookie handling

## v5.4.18 (2021/10/19)
- **New:** Official support for 2 new providers: `crossid`, `untappd`

## v5.4.17 (2021/09/04)
- **New:** Official support for 2 new providers: `trustpilot`, `unbounce`
- **Change:** Updated 1 provider: `yandex`

## v5.4.16 (2021/07/18)
- **New:** Official support for 2 new providers: `adobe`, `procore`
- **Change:** Updated 1 provider: `linkedin`

## v5.4.15 (2021/06/20)
- **New:** Official support for 2 new providers: `notion`, `sellsy`

## v5.4.14 (2021/05/16)
- **Change:** Return user profile for `apple`

## v5.4.13 (2021/04/18)
- **Change:** Updated 1 provider: `withings`
- **Fix:** Type definitions for TypeScript

## v5.4.12 (2021/03/20)
- **Fix:** Type definitions for TypeScript

## v5.4.11 (2021/03/20)
- **Fix:** Better support for JavaScript bundlers
- **Change:** Updated 1 provider: `wechat`

## v5.4.10 (2021/03/07)
- **New:** Official support for 3 new providers: `huddle`, `netlify`, `snowflake`
- **Change:** Removed 1 discontinued provider: `mixer`
- **Change:** Renamed provider `surveygizmo` to `alchemer`
- **Change:** Updated 4 providers: `discord`, `ibm`, `okta`, `twitch`
- **Fix:** Error on missing `state` and `nonce`

## v5.4.9 (2020/11/22)
- **Fix:** Type definitions for TypeScript

## v5.4.8 (2020/11/17)
- **Fix:** Type definitions for TypeScript

## v5.4.7 (2020/11/16)
- **Fix:** Type definitions for TypeScript

## v5.4.6 (2020/11/16)
- **New:** Type definitions for TypeScript
- **New:** Official support for 1 new provider: `keycloak`

## v5.4.5 (2020/10/11)
- **Fix:** Allow for more clock skew for the `iat` and `nbf` claims when using `private_key_jwt` authentication for the token endpoint
- **New:** HTTP Framework handler for Curveball
- **New:** Official support for 2 new providers: `figma`, `mendeley`

## v5.4.4 (2020/09/23)
- **New:** Support for `response_mode: form_post`

## v5.4.3 (2020/09/21)
- **Fix:** Path matching for `gcloud` handler - [docs](https://github.com/simov/grant-gcloud#routes)

## v5.4.2 (2020/09/17)
- **Fix:** Path matching for `aws` handler - [docs](https://github.com/simov/grant-aws#routes)

## v5.4.1 (2020/09/14)
- **Fix:** Improved path mathching for `aws` handler + support for event format v2
- **New:** Official support for 2 new providers: `autodesk`, `storyblok`
- **Change:** Renamed provider `zeit` to `vercel`

## v5.4.0 (2020/09/01)
- **New:** HTTP Framework handler for Fastify

## v5.3.0 (2020/08/09)
- **New:** Serverless handlers for [AWS Lambda](https://github.com/simov/grant-aws), [Azure Function](https://github.com/simov/grant-azure), [Google Cloud Function](https://github.com/simov/grant-gcloud) and [Vercel](https://github.com/simov/grant-vercel)
- **New:** RSA-SHA1 signature method support for OAuth1.0a
- **Fix:** OAuth2 support for `intuit`
- **Fix:** Profile endpoints for `qq` and `weibo`

## v5.2.0 (2020/06/07)
- **New:** Support for [request options](https://github.com/simov/grant#misc-request)
- **New:** Official support for 2 new providers: `apple`, `garmin`

## v5.1.1 (2020/05/25)
- **Fix:** The upcoming Grant constructor

## v5.1.0 (2020/05/25)
- **New:** Support for `private_key_jwt` client authentication
- **New:** `grant-profile` was deprecated as standalone module and is now [embedded](https://github.com/simov/grant#profile) into Grant
- **New:** Increase the random `state` and `nonce` size
- **New:** Official support for 4 new providers: `cas`, `cognito`, `fusionauth`, `logingov`

## v5.0.1 (2020/05/01)
- **Fix:** Fixed the path matching regexp for Express and Koa

## v5.0.0 (2020/04/18)
- **Breaking:** Drop support for Node v4 and v6
- **Breaking:** Return `id_token` as string by default
- **Breaking:** Change in the `response` configuration
- **New:** `origin` and `prefix` configuration
- **Deprecate:** Koa v1 and Hapi <= v16
- **Deprecate:** `protocol`, `host`, and `path` configuration
- **[Migration Guide: from v4 to v5](https://github.com/simov/grant/blob/master/MIGRATION.md)**

## v4.7.0 (2020/01/26)
- **New:** [PKCE](https://github.com/simov/grant/commit/3b04eb69a278165ae9be7ba7a06e8b85da21c5e5) support
- **New:** [input state](https://github.com/simov/grant/commit/3b04eb69a278165ae9be7ba7a06e8b85da21c5e5) overrides
- **New:** [output state](https://github.com/simov/grant/commit/3b04eb69a278165ae9be7ba7a06e8b85da21c5e5) transport
- **New:** user-agent header is set on all internal requests

## v4.6.6 (2020/01/01)
- **Fix:** Regression about race condition for [slow session stores](https://github.com/simov/grant/pull/122) in Express middleware
- **New:** Official support for 2 new providers: `livechat` and `zeit`

## v4.6.5 (2019/12/07)
- **Fix:** Support for `instagram` Graph API

## v4.6.4 (2019/10/27)
- **New:** Official support for 2 new providers: `line` and `naver`
- **Fix:** Updated 4 providers: `clio`, `concur`, `familysearch` and `fitbit`

## v4.6.3 (2019/09/07)
- **New:** Official support for 3 new providers: `atlassian`, `aweber`, `phantauth`
- **Change:** Removed 6 discontinued providers: `dailymile`, `everyplay`, `fluidsurveys`, `moves`, `mydigipass`, `producteev`
- **Change:** Renamed `letsfreckle` to `nokotime`

## v4.6.2 (2019/07/29)
- **New:** Official support for 3 new providers: `mailxpert`, `snapchat` and `zoom`

## v4.6.1 (2019/07/06)
- **Fix:** Support for `cookie-session` in Express middleware

## v4.6.0 (2019/06/23)
- **Fix:** Race condition for [slow session stores](https://github.com/simov/grant/pull/122) in Express middleware
- **New:** `koa-mount` no longer required for the Koa middleware

## v4.5.2 (2019/05/19)
- **Fix:** Support for **@hapi/hapi** namespace

## v4.5.1 (2019/04/07)
- **Fix:** Support for **Hapi >= 18**

## v4.5.0 (2019/03/04)
- **New:** Added [`token_endpoint_auth_method`](https://github.com/simov/grant#token-endpoint-auth-method) option
- **New:** Official support for 1 new provider: `wechat`

## v4.4.1 (2019/01/25)
- **Fix:** Accept array of `aud` claims when validating an `id_token`
- **New:** Official support for 1 new provider: `qq`

## v4.4.0 (2019/01/11)
- **New:** Added `response` option for limiting the response data

## v4.3.1 (2019/01/06)
- **Fix:** Nested static overrides filtering

## v4.3.0 (2019/01/02)
- **New:** Explicit `overrides` option for defining static overrides
- **New:** Official support for 2 new providers: `ibm`, `mention`

## v4.2.2 (2018/12/07)
- **New:** Official support for 2 new providers: `freelancer`, `hootsuite`
- **Change:** Removed 1 discontinued provider: `jawbone`

## v4.2.1 (2018/11/27)
- **Fix:** Regression regarding missing session in the callback route

## v4.2.0 (2018/11/10)
- **New:** [OpenID Connect](https://github.com/simov/grant#openid-connect) `id_token` and `nonce` support
- **New:** The `server` configuration option is now called `defaults` (`server` is still allowed)
- **New:** Explicit `dynamic` option to control the Dynamic Override feature
- **Change:** The Dynamic Override is now **disabled by default!** In case you rely on it you have to enable it explicitly. Use the [more granular](https://github.com/simov/grant#dynamic-override) configuration or the [proxy one](https://github.com/simov/grant#oauth-proxy)
- **New:** Official support for 2 new providers: `mastodon`, `onelogin`
- **Change:** Updated 4 providers: `bitbucket`, `strava`, `twitch`, `yahoo`

## v4.1.2 (2018/07/16)
- **New:** Official support for 4 new providers: `arcgis`, `nest`, `okta`, `typeform`
- **Change:** Updated 2 providers: `dropbox`, `withings`

## v4.1.1 (2018/04/22)
- **New:** Official support for 6 new providers: `auth0`, `bettlenet`, `mixer`, `nylas`, `timelyapp`, `viadeo`
- **Change:** Removed 5 discontinued providers: `appnet`, `codeplex`, `elance`, `odesk`, `rdio`

## v4.1.0 (2018/03/18)
- **New:** Support for **Hapi >= 17**

## v4.0.1 (2018/03/15)
- **Fix:** Minor fix in `request-compose`

## v4.0.0 (2018/03/14)
- **Change:** Officially **Node >= 4.0.0 required!**
- **Change:** Dropped the `request` dependency in favor of `request-compose`
- **Change:** Return errors more consistently based on the `transport` used (see below)
- **Change:** The internal session variable `step1` was renamed to `request`
- **Change:** The internal `_config` property is no longer exposed

```js
app.use(new Grant({server: {transport: 'session'}}))
app.get('/final_callback', (req, res) => {
  if (req.query.error) {} // v3.x
  if (req.session.grant.response.error) {} // v4.x
})
```

## v3.8.2 (2018/02/13)
- **Change:** Migrate all OAuth endpoints to HTTPS

## v3.8.1 (2017/12/13)
- **New:** Official support for 2 new providers: `authentiq` and `patreon`

## v3.8.0 (2017/06/07)
- **Change:** Hapi is now using the internal `config` object directly through the middleware instance
- **Fix:** Dynamic overrides support for Hapi >= 12.x
- **New:** Hapi middleware configuration can be passed in the constructor
- **New:** First class support for **Koa >= 2.x** using `async`/`await` **Node >= 8.0.0 required!**
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
- **New:** `transport` option that allows the response data to be returned in the final callback either as querystring or in the [session](https://github.com/simov/grant/blob/master/examples/session-transport/app.js)
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
