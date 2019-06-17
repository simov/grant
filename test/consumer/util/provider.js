
var http = require('http')
var url = require('url')
var qs = require('qs')


module.exports = {
  oauth1: (port) => new Promise((resolve) => {
    var callback
    var server = http.createServer()
    server.on('request', (req, res) => {
      if (/^\/request_url/.test(req.url)) {
        callback = decodeURIComponent(/oauth_callback="(.+?)"/.exec(req.headers.authorization)[1])
        res.writeHead(200, {'content-type': 'application/x-www-form-urlencoded'})
        res.end(qs.stringify({oauth_token: 'token', oauth_token_secret: 'secret'}))
      }
      else if (/^\/authorize_url/.test(req.url)) {
        var location = callback + '?' + qs.stringify({
          oauth_token: 'token', oauth_verifier: 'verifier'})
        res.writeHead(302, {location})
        res.end()
      }
      else if (/^\/access_url/.test(req.url)) {
        res.writeHead(200, {'content-type': 'application/json'})
        res.end(JSON.stringify({
          oauth_token: 'token', oauth_token_secret: 'secret'
        }))
      }
    })
    server.listen(port, () => resolve(server))
  }),
  oauth2: (port) => new Promise((resolve) => {
    var server = http.createServer()
    server.on('request', (req, res) => {
      if (/^\/authorize_url/.test(req.url)) {
        var parsed = url.parse(req.url, false)
        var query = qs.parse(parsed.query)
        var location = query.redirect_uri + '?' + qs.stringify({code: 'code'})
        res.writeHead(302, {location})
        res.end()
      }
      else if (/^\/access_url/.test(req.url)) {
        res.writeHead(200, {'content-type': 'application/json'})
        res.end(JSON.stringify({
          access_token: 'token', refresh_token: 'refresh', expires_in: 3600
        }))
      }
    })
    server.listen(port, () => resolve(server))
  }),
}
