
## Change Log

### v3.3.2 (2015/06/05)
- `Changed` a few minor changes to the project's meta files
- `Added` official support for 2 more providers

### v3.3.1 (2015/05/21)
- `Added` official support for 10 more providers

### v3.3.0 (2015/05/17)
- `Changed` the Express middleware is no longer using the [express-session middleware](https://github.com/simov/grant#express) internally
- `Changed` the Express and Koa middlewares are no longer using their [body-parser middleware](https://github.com/simov/grant#dynamic-override) internally
- `Changed` Express is set as peerDependency in grant-express
- `Changed` Koa is set as peerDependency in grant-koa
- `Changed` Yar is no longer set as peerDependency in grant-hapi, although using session is still required

### v3.2.0 (2015/04/23)
- `Changed` any of the [reserved keys](https://github.com/simov/grant/blob/master/config/reserved.json) can be overriden for a provider
- `Changed` allow [custom provider](https://github.com/simov/grant#custom-providers) configuration

### v3.1.0 (2015/04/14)
- `Added` transport option, this allows the response data to be returned in the final callback either as querystring or in the [session](https://github.com/simov/grant/blob/master/example/session-transport/app.js)
- `Added` state:true option, this enables auto generated random state on each authorization attempt (OAuth2 only)

### v3.0.3 (2015/04/02)
- `Changed` allow any session store to be used with the [Koa middleware](https://github.com/simov/grant#koa)
- `Added` Koa [session store examples](https://github.com/simov/grant/tree/master/example/koa-session)
- `Changed` using koa-route instead of koa-router internally in the Koa middleware
- `Changed` bumped a few module dependency versions
- `Changed` grant-hapi now uses peerDependencies

### v3.0.2 (2015/03/17)
- `Fixed` removed default Express require left over in index.js

### v3.0.1 (2015/03/15)
- `Fixed` examples

### v3.0.0 (2015/03/15)
- `Changed` every [consumer middleware](https://github.com/simov/grant#express) now have its own module

### v2.0.1 (2015/03/02)
- `Added` Hapi middleware
- `Added` [dynamic overrides](https://github.com/simov/grant#dynamic-override) via `GET` request
- `Added` a bunch of [examples](https://github.com/simov/grant/tree/master/example)

### v2.0.0 (2015/01/06)
- Complete rewrite of Grant using the [request](https://github.com/request/request) module
- `Added` Koa middleware
- `Changed` the [response data](https://github.com/simov/grant#response-data) format, now containing a `raw` key in it
- `Changed` [custom authorization parameters](https://github.com/simov/grant#quirks) regarding token expiration are no longer part of the scope array


---


### v1.1.4 (2014/11/27)
- No longer supported, though most of the configuration data structure remains intact in the newer releases, so migration should be easy

### v1.0.0 (2014/06/22)
