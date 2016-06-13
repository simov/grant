
# Koa Session Example


## Install

```bash
$ cd examples/koa-session
$ npm install
```

## OAuth Application

Create OAuth application for Facebook and set the application domain to be `dummy.com`

In your `hosts` file add this line `127.0.0.1 dummy.com`


## Configure

Edit the `config.json` file with your own OAuth application credentials


## Run the App

You need at least NodeJS version 11 or higher!

```bash
$ node --harmony koa-session.js
$ node --harmony koa-generic-session-redis.js
$ node --harmony koa-generic-session-mongo.js
$ node --harmony koa-session-store.js
$ node --harmony koa-session-store-mongo.js
```

## Start the Flow

To start the OAuth flow for Facebook navigate to `http://dummy.com:3000/connect/facebook` in your browser
