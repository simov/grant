
var express = require('express')
var session = require('express-session')
var grant = require('grant-express')
var fs = require('fs')


var decode = (id_token) => {
  var [header, payload, signature] = id_token.split('.')
  return {
    header: JSON.parse(Buffer.from(header, 'base64').toString('binary')),
    payload: JSON.parse(Buffer.from(payload, 'base64').toString('utf8')),
    signature
  }
}

express()
  .use(session({secret: 'grant', saveUninitialized: true, resave: true}))
  .use(grant(require('./config.json')))

  // http://localhost:3000/connect/google
  .get('/defaults', (req, res) => {
    res.end(JSON.stringify(req.session.grant.response, null, 2))
  })

  // http://localhost:3000/connect/google/browser
  .get('/browser', (req, res) => {
    res.writeHead(200, {'content-type': 'text/html'})
    res.end(`
      <script type="text/javascript">
        ${fs.readFileSync('browser.js', 'utf8')}
      </script>
    `)
  })

  // http://localhost:3000/connect/google/server
  .get('/server', (req, res) => {
    var response = req.session.grant.response
    response.id_token_jwt = decode(response.id_token)
    res.end(JSON.stringify(response, null, 2))
  })

  // http://localhost:3000/connect/google/jwt
  .get('/jwt', (req, res) => {
    res.end(JSON.stringify(req.session.grant.response, null, 2))
  })

  .listen(3000)
