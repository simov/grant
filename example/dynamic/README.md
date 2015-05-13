
# Dynamic Override Example


## Install

```bash
$ cd examples/dynamic
$ npm install
```

## OAuth Application

Create OAuth application for Facebook and Twitter. For Twitter set the callback url to be `http://dummy.com:3000/connect/twitter/callback`, for Facebook set the application domain to be `dummy.com`

In your `hosts` file add this line `dummy.com 127.0.0.1`


## Configure

Edit the `config.json` file with your own OAuth application credentials


## Run the App

```bash
$ node app.js
```

## Start the Flow

To start the OAuth flow for Facebook and dynamically override the `state` parameter via `POST` request navigate to `http://dummy.com:3000/connect_facebook_post`

Alternatively to start the OAuth flow for Facebook and dynamically override the `state` parameter via `GET` request navigate to `http://dummy.com:3000/connect_facebook_get`
