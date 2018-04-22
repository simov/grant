
# Koa Session Stores Example


## Install

```bash
$ cd examples/koa-session-stores
$ npm install
```

## OAuth

1. Create OAuth application for Facebook:
  - Settings -> Basic:
    - App Domains: `dummy.com`
    - Add Platform -> Website: `http://dummy.com`
  - Facebook Login -> Settings:
    - Valid OAuth Redirect URIs: `http://dummy.com:3000/connect/facebook/callback`

2. Edit your `hosts` file and add this line: `127.0.0.1 dummy.com`


## Config

Add your OAuth app credentials in `config.json`.


## Start

```bash
$ node koa-session.js
$ node koa-redis.js
$ node koa-mongo.js
```

## Login

- Navigate to `http://dummy.com:3000/connect/facebook` in your browser
