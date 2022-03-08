
var http = require('http')
var _url = require('url')
var qs = require('qs')

var buffer = (req, done) => {
  var data = ''
  req.on('data', (chunk) => data += chunk)
  req.on('end', () => done(
    /^{.*}$/.test(data) ? JSON.parse(data) : qs.parse(data)))
}
var _query = (req) => {
  var parsed = _url.parse(req.url, false)
  var query = qs.parse(parsed.query)
  return query
}
var _oauth = (req) =>
  qs.parse((req.headers.authorization || '')
    .replace('OAuth ', '').replace(/"/g, '').replace(/,/g, '&'))

var sign = (...args) => args.map((arg, index) => index < 2
  ? Buffer.from(JSON.stringify(arg)).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  : arg).join('.')

var provider = async ({flow, port = 5000}) => {
  var server = await (flow === 'oauth2' ? oauth2(port) : oauth1(port))
  return {
    oauth1,
    oauth2,
    on,
    server,
    url: (path) => `http://localhost:${port}${path}`,
    close: () => new Promise((resolve) => server.close(resolve))
  }
}

var oauth1 = (port) => new Promise((resolve) => {
  var callback
  var server = http.createServer()
  server.on('request', (req, res) => {
    var method = req.method
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
        on.request({url, headers, query, form, oauth})
        provider === 'sellsy'
          ? res.writeHead(200, {'content-type': 'application/json'})
          : res.writeHead(200, {'content-type': 'application/x-www-form-urlencoded'})
        provider === 'getpocket'
          ? res.end(qs.stringify({code: 'code'}))
          : provider === 'sellsy'
          ? res.end('authentification_url=https://apifeed.sellsy.com/0/login.php&oauth_token=token&oauth_token_secret=secret&oauth_callback_confirmed=true')
          : res.end(qs.stringify({oauth_token: 'token', oauth_token_secret: 'secret'}))
      })
    }
    else if (/authorize_url/.test(url)) {
      var location = callback + '?' +
        qs.stringify({oauth_token: 'token', oauth_verifier: 'verifier'})
      on.authorize({url, headers, query})
      res.writeHead(302, {location})
      res.end()
    }
    else if (/access_url/.test(url)) {
      buffer(req, (form) => {
        on.access({url, headers, query, form, oauth})
        res.writeHead(200, {'content-type': 'application/json'})
        provider === 'getpocket'
          ? res.end(JSON.stringify({access_token: 'token'}))
          : res.end(JSON.stringify({
            oauth_token: 'token',
            oauth_token_secret: 'secret',
            user_id: provider === 'twitter' ? 'id' : undefined,
          }))
      })
    }
    else if (/request_error_message/.test(url)) {
      callback = oauth.oauth_callback
      buffer(req, (form) => {
        on.request({url, headers, query, form, oauth})
        res.writeHead(200, {'content-type': 'application/x-www-form-urlencoded'})
        res.end(qs.stringify({error: {message: 'invalid'}}))
      })
    }
    else if (/request_error_token/.test(url)) {
      callback = oauth.oauth_callback
      buffer(req, (form) => {
        on.request({url, headers, query, form, oauth})
        res.writeHead(200, {'content-type': 'application/x-www-form-urlencoded'})
        res.end()
      })
    }
    else if (/request_error_status/.test(url)) {
      callback = oauth.oauth_callback
      buffer(req, (form) => {
        on.request({url, headers, query, form, oauth})
        res.writeHead(500, {'content-type': 'application/x-www-form-urlencoded'})
        res.end(qs.stringify({invalid: 'request_url'}))
      })
    }
    else if (/authorize_error_message/.test(url)) {
      var location = callback + '?' + qs.stringify({error: {message: 'invalid'}})
      on.authorize({url, headers, query})
      res.writeHead(302, {location})
      res.end()
    }
    else if (/authorize_error_token/.test(url)) {
      var location = callback
      on.authorize({url, headers, query})
      res.writeHead(302, {location})
      res.end()
    }
    else if (/access_error_status/.test(url)) {
      buffer(req, (form) => {
        on.access({url, headers, query, form, oauth})
        res.writeHead(500, {'content-type': 'application/json'})
        res.end(JSON.stringify({invalid: 'access_url'}))
      })
    }
    else if (/profile_url/.test(req.url)) {
      on.profile({method, url, query, headers})
      res.writeHead(200, {'content-type': 'application/json'})
      provider === 'flickr'
        ? res.end('callback({"user": "simov"})')
        : res.end(JSON.stringify({user: 'simov'}))
    }
  })
  server.listen(port, () => resolve(server))
})

var oauth2 = (port) => new Promise((resolve) => {
  var server = http.createServer()
  var openid
  server.on('request', (req, res) => {
    var method = req.method
    var url = req.url
    var headers = req.headers
    var query = _query(req)
    var provider = /^\/(.*)\/.*/.exec(url) && /^\/(.*)\/.*/.exec(url)[1]

    if (/authorize_url/.test(req.url)) {
      openid = (query.scope || []).includes('openid')
      on.authorize({provider, method, url, headers, query})
      if (query.response_mode === 'form_post') {
        provider === 'apple'
        ? res.end(qs.stringify({
          code: 'code',
          user: {name: {firstName: 'jon', lastName: 'doe'}, email: 'jon@doe.com'}
        }))
        : res.end('code')
        return
      }
      var location = query.redirect_uri + '?' + (
        provider === 'intuit'
          ? qs.stringify({code: 'code', realmId: '123'})
          : qs.stringify({code: 'code'})
      )
      res.writeHead(302, {location})
      res.end()
    }
    else if (/access_url/.test(req.url)) {
      buffer(req, (form) => {
        on.access({provider, method, url, headers, query, form})
        res.writeHead(200, {'content-type': 'application/json'})
        provider === 'concur'
        ? res.end(' <Token>token</Token> <Refresh_Token>refresh</Refresh_Token> ')
        : provider === 'withings'
        ? res.end(JSON.stringify({body: {
          access_token: 'token', refresh_token: 'refresh', expires_in: 3600
        }}))
        : res.end(JSON.stringify({
          access_token: 'token', refresh_token: 'refresh', expires_in: 3600,
          id_token: openid ? sign({typ: 'JWT'}, {nonce: 'whatever'}, 'signature') : undefined,
          open_id: provider === 'tiktok' ? 'id' : undefined,
          uid: provider === 'weibo' ? 'id' : undefined,
          openid: provider === 'wechat' ? 'openid' : undefined,
        }))
      })
    }
    else if (/authorize_error_message/.test(req.url)) {
      on.authorize({url, query, headers})
      var location = query.redirect_uri + '?' + qs.stringify({error: {message: 'invalid'}})
      res.writeHead(302, {location})
      res.end()
    }
    else if (/authorize_error_code/.test(req.url)) {
      on.authorize({url, query, headers})
      var location = query.redirect_uri
      res.writeHead(302, {location})
      res.end()
    }
    else if (/authorize_error_state_mismatch/.test(req.url)) {
      on.authorize({url, query, headers})
      var location = query.redirect_uri + '?' + qs.stringify({code: 'code', state: 'whatever'})
      res.writeHead(302, {location})
      res.end()
    }
    else if (/authorize_error_state_missing/.test(req.url)) {
      on.authorize({url, query, headers})
      var location = query.redirect_uri + '?' + qs.stringify({code: 'code'})
      res.writeHead(302, {location})
      res.end()
    }
    else if (/access_error_nonce_mismatch/.test(req.url)) {
      buffer(req, (form) => {
        on.access({method, url, query, headers, form})
        res.writeHead(200, {'content-type': 'application/json'})
        res.end(JSON.stringify({
          id_token: sign({typ: 'JWT'}, {nonce: 'whatever'}, 'signature')
        }))
      })
    }
    else if (/access_error_nonce_missing/.test(req.url)) {
      buffer(req, (form) => {
        on.access({method, url, query, headers, form})
        res.writeHead(200, {'content-type': 'application/json'})
        res.end(JSON.stringify({
          id_token: sign({typ: 'JWT'}, {}, 'signature')
        }))
      })
    }
    else if (/access_error_message/.test(req.url)) {
      buffer(req, (form) => {
        on.access({method, url, query, headers, form})
        res.writeHead(200, {'content-type': 'application/json'})
        res.end(JSON.stringify({error: {message: 'invalid'}}))
      })
    }
    else if (/access_error_status/.test(req.url)) {
      buffer(req, (form) => {
        on.access({method, url, query, headers, form})
        res.writeHead(500, {'content-type': 'application/json'})
        res.end(JSON.stringify({invalid: 'access_url'}))
      })
    }
    else if (/profile_url/.test(req.url)) {
      if (method === 'POST') {
        buffer(req, (form) => {
          on.profile({method, url, query, headers, form})
          res.writeHead(200, {'content-type': 'application/json'})
          res.end(JSON.stringify({user: 'simov'}))
        })
      }
      else {
        on.profile({method, url, query, headers})
        res.writeHead(200, {'content-type': 'application/json'})
        res.end(JSON.stringify({user: 'simov'}))
      }
    }
    else if (/profile_error/.test(req.url)) {
      on.profile({method, url, query, headers})
      res.writeHead(400, {'content-type': 'application/json'})
      res.end(JSON.stringify({error: {message: 'Not Found'}}))
    }
  })
  server.listen(port, () => resolve(server))
})

var on = {
  request: () => {},
  authorize: () => {},
  access: () => {},
  profile: () => {},
}

module.exports = provider
