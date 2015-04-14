
## Change Log

### v3.1.0 (2015/04/14)
- `Added` transport option, this allows the response data to be returned in the final callback either as querystring or in the [session](https://github.com/simov/grant/blob/master/example/session-transport/app.js)
- `Added` state:true option, this enables auto generated random state on each authorization attempt (OAuth2 only)

### v3.0.3 (2015/04/02)
- `Changed` allow any session store in [Koa middleware](https://github.com/simov/grant#koa)
- `Added` Koa [session store examples](https://github.com/simov/grant/tree/master/example/koa-session)
- `Changed` use koa-route instead of koa-router in Koa middleware
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
- Completely re-written using the [request](https://github.com/request/request) module
- `Added` Koa middleware
- `Changed` the [response data](https://github.com/simov/grant#response-data) format, now containing a `raw` key in it
- `Changed` [custom authorization parameters](https://github.com/simov/grant#quirks) regarding token expiration are no longer part of the scope array


---


### v1.1.4 (2014/11/27)
- No longer supported, though most of the configuration data structure remains intact in the newer releases, so migration should be easy

### v1.0.0 (2014/06/22)
