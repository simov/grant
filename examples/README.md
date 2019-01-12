
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
    [Dynamic Override](https://github.com/simov/grant/tree/master/examples/dynamic-override) |
    [OAuth Proxy](https://github.com/simov/grant/tree/master/examples/oauth-proxy) |
    [Like a BOSS](https://github.com/simov/oauth-like-a-boss)
- **Misc**
  - [OpenID Connect](https://github.com/simov/grant/tree/master/examples/openid-connect) |
    [Limit Response](https://github.com/simov/grant/tree/master/examples/limit-response) |
    [JWT](https://github.com/simov/grant/tree/master/examples/jwt) |
    [Custom Provider](https://github.com/simov/grant/tree/master/examples/custom-provider)

# Install

```bash
$ cd examples/[example-folder]
$ npm install
```

# OAuth App

Most of the examples are using Facebook and Twitter for showcasing the OAuth 2.0 and OAuth 1.0a flow respectively.

Create OAuth Apps for Facebook and Twitter (or any provider you want), and set their `redirect_uri` accordingly:

- `http://localhost:3000/connect/facebook/callback`
- `http://localhost:3000/connect/twitter/callback`

# Grant Configuration

Add your OAuth App credentials in `config.json`

# Start Server

```bash
$ node app.js
```

# Login

Navigate to the following URLs in your browser:

- `http://localhost:3000/connect/facebook`
- `http://localhost:3000/connect/twitter`

---

### JWT Example

Create self-signed certificates:

```bash
# generate private key
openssl genrsa 2048 > private.pem
# generate the self signed certificate
openssl req -x509 -new -key private.pem -out public.pem
```
