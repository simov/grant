
# Examples

Most of the examples are using Google and Twitter for showcasing the OAuth 2.0 and OAuth 1.0a flow respectively.

## App

Create OAuth Apps for Google and Twitter (or any provider you want), and set their `redirect_uri` accordingly:

- `http://localhost:3000/connect/google/callback`
- `http://localhost:3000/connect/twitter/callback`

## Configuration

Add your OAuth App credentials in `config.json`

## Server

Start the server:

```bash
$ npm install
$ node app.js
```

## Login

Navigate to the following URLs in your browser:

- `http://localhost:3000/connect/google`
- `http://localhost:3000/connect/twitter`
