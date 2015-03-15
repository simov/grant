
# Static Override Example


## Install

```bash
$ cd examples/override
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

To start the OAuth flow for Facebook and request permissions to the user's groups and likes navigate to `http://dummy.com:3000/connect/facebook` in your browser

To start the OAuth flow for Facebook and request permissions to the user's photos navigate to `http://dummy.com:3000/connect/facebook/photos` in your browser

To start the OAuth flow for Facebook and request permissions to the user's videos navigate to `http://dummy.com:3000/connect/facebook/videos` in your browser

To start the OAuth flow for Twitter navigate to `http://dummy.com:3000/connect/twitter` in your browser

To start the OAuth flow for Twitter and use your second application that requests write access to the user's profile navigate to `http://dummy.com:3000/connect/twitter/write` in your browser
