
# Profile Example


## Install

```bash
$ cd examples/express
$ npm install
```

## OAuth Application

Create OAuth application for Facebook and Twitter. For Twitter set the callback url to be `http://dummy.com:3000/connect/twitter/callback`, for Facebook set the application domain to be `dummy.com`

In your `hosts` file add this line `127.0.0.1 dummy.com`


## Configure

Edit the `config.json` file with your own OAuth application credentials


## Run the App

```bash
$ node app.js
```

## Start the Flow

To start the OAuth flow for Facebook navigate to `http://dummy.com:3000/connect/facebook` in your browser


To start the OAuth flow for Twitter navigate to `http://dummy.com:3000/connect/twitter` in your browser
