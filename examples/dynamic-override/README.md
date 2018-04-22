
# Dynamic Override Example


## Install

```bash
$ cd examples/dynamic-override
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
$ node app.js
```

## Login

- Default Configuration - to request access to the user's profile and email navigate to `http://dummy.com:3000/connect/facebook` in your browser
- Dynamic Override via GET - to request access to the user's photos and videos navigate to `http://dummy.com:3000/connect/facebook?scope=user_photos%2Cuser_videos` in your browser
- Dynamic Override via POST - navigate to `http://dummy.com:3000/form` in your browser and pick a few scopes to request access to
