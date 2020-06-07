
# Grant v5


## Breaking: Return `id_token` as string by default

In Grant v4 the `id_token` was returned decoded by default:

```js
{
  id_token: {header: {}, payload: {}, signature: '...'},
  access_token: '...',
  refresh_token: '...'
}
```

In Grant v5 the `id_token` is returned as string instead:

```js
{
  id_token: 'abc.abc.abc',
  access_token: '...',
  refresh_token: '...'
}
```

#### Documentation

- [response data](https://github.com/simov/grant#callback-data)


## Breaking: Change in `response` configuration

In Grant v4 the following `response` configuration:

```json
{
  "google": {
    "response": ["jwt"]
  }
}
```

Was returning the decoded JWT as `id_token_jwt`:

```js
{
  id_token: '...',
  access_token: '...',
  refresh_token: '...',
  id_token_jwt: {header: {}, payload: {}, signature: '...'}
}
```

In Grant v5 the decoded JWT can only be returned by using the `response` configuration explicitly:

```json
{
  "google": {
    "response": ["tokens", "raw", "jwt"]
  }
}
```

The decoded JWT will be available as `jwt.id_token` instead:

```js
{
  id_token: '...',
  access_token: '...',
  refresh_token: '...',
  raw: {
    id_token: '...',
    access_token: '...',
    refresh_token: '...',
    some: 'other data'
  },
  jwt: {id_token: {header: {}, payload: {}, signature: '...'}}
}
```

#### Documentation

- [`response`](https://github.com/simov/grant#callback-response) configuration


## Deprecate: `protocol` and `host` configuration

In Grant v4 the `protocol` and the `host` were used to construct the origin of your client server:

```json
{
  "defaults": {
    "protocol": "http",
    "host": "localhost:3000"
  }
}
```

In Grant v5 it is reommended to use the `origin` configuration instead:

```json
{
  "defaults": {
    "origin": "http://localhost:3000"
  }
}
```

#### Documentation

- [`origin`](https://github.com/simov/grant#connect-origin) configuration


## Deprecate: `path` configuration

In Grant v4 it was possible to set a `path` prefix:

```json
{
  "defaults": {
    "protocol": "http",
    "host": "localhost:3000",
    "path": "/oauth"
  }
}
```

The equivalent of the above in Grant v5 is:

```json
{
  "defaults": {
    "origin": "http://localhost:3000",
    "prefix": "/oauth/connect"
  }
}
```

#### Documentation

- [`prefix`](https://github.com/simov/grant#connect-prefix) configuration
- [path prefix](https://github.com/simov/grant#misc-path-prefix) for a middleware


## Deprecate: Meta modules

In Grant v4 it was possible to require Express, Koa and Hapi using:

```js
var grant = require('grant-express')
var grant = require('grant-koa')
var grant = require('grant-hapi')
```

In Grant v5 it is recommended to use one of the following:

```js
var grant = require('grant').express()(config)
var grant = require('grant').express()({config, ...})
var grant = require('grant').express(config)
var grant = require('grant').express({config, ...})
var grant = require('grant')({handler: 'express', config})
```

#### Documentation

- [handler constructors](https://github.com/simov/grant#misc-handler-constructors) configuration
