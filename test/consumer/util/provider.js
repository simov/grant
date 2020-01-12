
var http = require('http')
var url = require('url')
var qs = require('qs')

var buffer = (req, done) => {
  var data = ''
  req.on('data', (chunk) => data += chunk)
  req.on('end', () => done(qs.parse(data)))
}
var parse = (req) => {
  var parsed = url.parse(req.url, false)
  var query = qs.parse(parsed.query)
  return {query}
}

var oauth1 = (port) => new Promise((resolve) => {
  var callback
  var server = http.createServer()
  server.on('request', (req, res) => {
    if (/^\/request_url/.test(req.url)) {
      callback = decodeURIComponent(/oauth_callback="(.+?)"/.exec(req.headers.authorization)[1])
      buffer(req, (form) => {
        oauth1.request({form})
        res.writeHead(200, {'content-type': 'application/x-www-form-urlencoded'})
        res.end(qs.stringify({oauth_token: 'token', oauth_token_secret: 'secret'}))
      })
    }
    else if (/^\/authorize_url/.test(req.url)) {
      var location = callback + '?' +
        qs.stringify({oauth_token: 'token', oauth_verifier: 'verifier'})
      var {query} = parse(req)
      oauth1.authorize({query})
      res.writeHead(302, {location})
      res.end()
    }
    else if (/^\/access_url/.test(req.url)) {
      buffer(req, (form) => {
        oauth1.access({form})
        res.writeHead(200, {'content-type': 'application/json'})
        res.end(JSON.stringify({
          oauth_token: 'token', oauth_token_secret: 'secret'
        }))
      })
    }
  })
  server.listen(port, () => resolve(server))
})

var oauth2 = (port) => new Promise((resolve) => {
  var server = http.createServer()
  server.on('request', (req, res) => {
    if (/^\/authorize_url/.test(req.url)) {
      var {query} = parse(req)
      oauth2.authorize({query})
      var location = query.redirect_uri + '?' + qs.stringify({code: 'code'})
      res.writeHead(302, {location})
      res.end()
    }
    else if (/^\/access_url/.test(req.url)) {
      buffer(req, (form) => {
        oauth2.access({form})
        res.writeHead(200, {'content-type': 'application/json'})
        res.end(JSON.stringify({
          access_token: 'token', refresh_token: 'refresh', expires_in: 3600
        }))
      })
    }
  })
  server.listen(port, () => resolve(server))
})

oauth1.request = () => {}
oauth1.authorize = () => {}
oauth1.access = () => {}
oauth2.authorize = () => {}
oauth2.access = () => {}

module.exports = {oauth1, oauth2}
