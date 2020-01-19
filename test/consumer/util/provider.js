
var http = require('http')
var _url = require('url')
var qs = require('qs')

var buffer = (req, done) => {
  var data = ''
  req.on('data', (chunk) => data += chunk)
  req.on('end', () => done(qs.parse(data)))
}
var _query = (req) => {
  var parsed = _url.parse(req.url, false)
  var query = qs.parse(parsed.query)
  return query
}
var _oauth = (req) =>
  qs.parse((req.headers.authorization || '')
    .replace('OAuth ', '').replace(/"/g, '').replace(/,/g, '&'))

var oauth1 = (port) => new Promise((resolve) => {
  var callback
  var server = http.createServer()
  server.on('request', (req, res) => {
    var url = req.url
    var headers = req.headers
    var oauth = _oauth(req)
    var query = _query(req)
    var provider = /^\/(.*)\/.*/.exec(url) && /^\/(.*)\/.*/.exec(url)[1]

    if (/request_url/.test(url)) {
      callback = oauth.oauth_callback
      buffer(req, (form) => {
        if (provider === 'getpocket') {
          callback = form.redirect_uri
        }
        oauth1.request({url, headers, query, form, oauth})
        res.writeHead(200, {'content-type': 'application/x-www-form-urlencoded'})
        provider === 'getpocket'
          ? res.end(qs.stringify({code: 'code'}))
          : res.end(qs.stringify({oauth_token: 'token', oauth_token_secret: 'secret'}))
      })
    }
    else if (/authorize_url/.test(url)) {
      var location = callback + '?' + (
        provider === 'intuit'
          ? qs.stringify({oauth_token: 'token', oauth_verifier: 'verifier', realmId: '123'})
          : qs.stringify({oauth_token: 'token', oauth_verifier: 'verifier'})
      )
      oauth1.authorize({url, headers, query})
      res.writeHead(302, {location})
      res.end()
    }
    else if (/access_url/.test(url)) {
      buffer(req, (form) => {
        oauth1.access({url, headers, query, form, oauth})
        res.writeHead(200, {'content-type': 'application/json'})
        provider === 'getpocket'
          ? res.end(JSON.stringify({access_token: 'token'}))
          : res.end(JSON.stringify({oauth_token: 'token', oauth_token_secret: 'secret'}))
      })
    }
  })
  server.listen(port, () => resolve(server))
})

var oauth2 = (port) => new Promise((resolve) => {
  var server = http.createServer()
  server.on('request', (req, res) => {
    var url = req.url
    var headers = req.headers
    var query = _query(req)

    if (/^\/authorize_url/.test(req.url)) {
      oauth2.authorize({url, query, headers})
      var location = query.redirect_uri + '?' + qs.stringify({code: 'code'})
      res.writeHead(302, {location})
      res.end()
    }
    else if (/^\/access_url/.test(req.url)) {
      buffer(req, (form) => {
        oauth2.access({url, query, headers, form})
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
