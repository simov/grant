
# Express 4 Example


## Install

```bash
$ cd examples/express-4
$ npm install
```

## OAuth

1. Create OAuth application for Facebook:
  - Settings -> Basic:
    - App Domains: `dummy.com`
    - Add Platform -> Website: `http://dummy.com`
  - Facebook Login -> Settings:
    - Valid OAuth Redirect URIs: `http://dummy.com:3000/connect/facebook/callback`

2. Create OAuth application for Twitter:
  - Callback URL: `http://dummy.com:3000/connect/twitter/callback`

3. Edit your `hosts` file and add this line: `127.0.0.1 dummy.com`


## Config

Add your OAuth app credentials in `config.json`.


## Start

```bash
$ node app.js
```

## Login

- Facebook - navigate to `http://dummy.com:3000/connect/facebook` in your browser
- Twitter - navigate to `http://dummy.com:3000/connect/twitter` in your browser
