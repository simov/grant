
# Table of Contents


- **Basics**
  - [Basics](https://github.com/simov/grant/tree/master/examples/basics) |
    [Session Transport](https://github.com/simov/grant/tree/master/examples/session-transport) |
    [User Profile](https://github.com/simov/grant/tree/master/examples/user-profile) |
    [Path Prefix](https://github.com/simov/grant/tree/master/examples/path-prefix)
- **HTTP Frameworks**
  - [Express 4](https://github.com/simov/grant/tree/master/examples/express-4) |
    [Express 3](https://github.com/simov/grant/tree/master/examples/express-3) |
    [Koa 2](https://github.com/simov/grant/tree/master/examples/koa-2) |
    [Koa 1](https://github.com/simov/grant/tree/master/examples/koa-1) |
    [Hapi 17](https://github.com/simov/grant/tree/master/examples/hapi-17) |
    [Hapi 16](https://github.com/simov/grant/tree/master/examples/hapi-16)
- **Session Stores**
  - [Express 4](https://github.com/simov/grant/tree/master/examples/express-session-stores) |
    [Koa 1](https://github.com/simov/grant/tree/master/examples/koa-session-stores) |
    [Hapi 16](https://github.com/simov/grant/tree/master/examples/hapi-session-stores)
- **Configuration Overrides**
  - [Static Override](https://github.com/simov/grant/tree/master/examples/static-override) |
    [Dynamic Override](https://github.com/simov/grant/tree/master/examples/dynamic-override)
- **Misc**
  - [JWT](https://github.com/simov/grant/tree/master/examples/jwt) |
    [Custom Provider](https://github.com/simov/grant/tree/master/examples/custom-provider)


# How To


## Install

```bash
$ cd example-folder
$ npm install
```

## OAuth

Create OAuth application for Facebook:

> Facebook Login -> Settings: Valid OAuth Redirect URIs: `http://localhost:3000/connect/facebook/callback`

Create OAuth application for Twitter:

> Callback URL: `http://localhost:3000/connect/twitter/callback`


## Config

Add your OAuth app credentials in `config.json`


## Start

```bash
$ node app.js
```


## Login

Navigate to `http://localhost:3000/connect/facebook` in your browser

Navigate to `http://localhost:3000/connect/twitter` in your browser


# Specific Examples


## Static Overrides - Login

Navigate to `http://localhost:3000/connect/facebook` in your browser

Navigate to `http://localhost:3000/connect/facebook/photos` in your browser

Navigate to `http://localhost:3000/connect/facebook/videos` in your browser

Navigate to `http://localhost:3000/connect/twitter` in your browser

Navigate to `http://localhost:3000/connect/twitter/write` in your browser


## Dynamic Overrides Login

Navigate to `http://localhost:3000/connect/facebook` in your browser

Navigate to `http://localhost:3000/connect/facebook?scope=user_photos%2Cuser_videos` in your browser

Navigate to `http://localhost:3000/form` in your browser and pick a few scopes to request access to


## Path Prefix - OAuth

Create OAuth application for Facebook:

> Facebook Login -> Settings: Valid OAuth Redirect URIs: `http://localhost:3000/path/prefix/connect/facebook/callback`

Create OAuth application for Twitter:

> Callback URL: `http://localhost:3000/path/prefix/connect/twitter/callback`


## JWT - Create self-signed certificates

```bash
# generate private key
openssl genrsa 2048 > private.pem
# generate the self signed certificate
openssl req -x509 -new -key private.pem -out public.pem
```
