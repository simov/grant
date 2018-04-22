
# Express Session Stores Example


## Install

```bash
$ cd examples/express-session-stores
$ npm install
```

## OAuth

1. Create OAuth application for Twitter:
  - Callback URL: `http://dummy.com:3000/connect/twitter/callback`

2. Edit your `hosts` file and add this line: `127.0.0.1 dummy.com`


## Config

Add your OAuth app credentials in `config.json`.


## Start

```bash
$ node express-session.js
$ node connect-redis.js
$ node connect-mongo.js
```

## Login

- Navigate to `http://dummy.com:3000/connect/twitter` in your browser
