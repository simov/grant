
# Basic Example


## Install

```bash
$ cd examples/basic
$ npm install
```

## OAuth Application

Create OAuth application for your Facebook and set the callback url to be `http://dummy.com:3000/connect/facebook/callback`

In your `hosts` file add this line `127.0.0.1 dummy.com`


## Configure

Edit the `config` object with your own OAuth application credentials


## Run the App

```bash
$ node app.js
```

## Start the Flow

To start the OAuth flow navigate to `http://dummy.com:3000/connect/facebook` in your browser
