
# Path Prefix Example


## Install

```bash
$ cd examples/path
$ npm install
```

## OAuth Application

Create OAuth application for Twitter and set the callback url to be `http://dummy.com:3000/path/prefix/connect/twitter/callback`

In your `hosts` file add this line `127.0.0.1 dummy.com`


## Configure

Edit the `config.json` file with your own OAuth application credentials


## Run the App

```bash
$ node app.js
```

## Start the Flow

To start the OAuth flow for Twitter navigate to `http://dummy.com:3000/path/prefix/connect/twitter` in your browser
