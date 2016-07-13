
# JWT Example

## Install

```bash
$ cd examples/jwt
$ npm install
```

## OAuth Application

Create OAuth application for Facebook, set the application domain to be `dummy.com`

In your `hosts` file add this line `127.0.0.1 dummy.com`


## Configure

Edit the `config.json` file with your own OAuth application credentials


## Create self-signed certificates

```bash
# generate private key
openssl genrsa 2048 > private.pem
# generate the self signed certificate
openssl req -x509 -new -key private.pem -out public.pem
```

## Run the App

```bash
$ node app.js
```

## Start the Flow

To start the OAuth flow for Facebook navigate to `http://dummy.com:3000/connect/facebook` in your browser
