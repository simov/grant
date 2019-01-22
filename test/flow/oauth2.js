
var t = require('assert')
var http = require('http')
var qs = require('qs')
var express = require('express')
var bodyParser = require('body-parser')
var Grant = require('../../').express()
var oauth2 = require('../../lib/flow/oauth2')
var oauth = require('../../config/oauth')

var sign = (...args) => args.map((arg, index) => index < 2
  ? Buffer.from(JSON.stringify(arg)).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  : arg).join('.')


describe('oauth2', () => {
  var url = (path) => `http://localhost:5000${path}`

  describe('success', () => {
    var server

    before((done) => {
      server = http.createServer()
      server.on('request', (req, res) => {
        res.writeHead(200, {'content-type': 'application/x-www-form-urlencoded'})
        req.pipe(res)
      })
      server.listen(5000, done)
    })

    it('authorize', async () => {
      var provider = {
        authorize_url: '/authorize_url',
        redirect_uri: '/redirect_uri',
        key: 'key',
        scope: 'read,write',
        state: '123',
        nonce: '456'
      }
      var url = await oauth2.authorize(provider)
      t.deepEqual(qs.parse(url.replace('/authorize_url?', '')), {
        client_id: 'key',
        response_type: 'code',
        redirect_uri: '/redirect_uri',
        scope: 'read,write',
        state: '123',
        nonce: '456'
      })
    })

    it('access', async () => {
      var provider = {
        access_url: url('/access_url'),
        redirect_uri: '/redirect_uri',
        key: 'key',
        secret: 'secret'
      }
      var authorize = {
        code: 'code'
      }
      var data = await oauth2.access(provider, authorize, {})
      t.deepEqual(data.raw, {
        grant_type: 'authorization_code',
        code: 'code',
        client_id: 'key',
        client_secret: 'secret',
        redirect_uri: '/redirect_uri'
      })
    })

    after((done) => {
      server.close(done)
    })
  })

  describe('error', () => {
    var server

    before((done) => {
      server = http.createServer()
      server.on('request', (req, res) => {
        if (/^\/access_url_nonce/.test(req.url)) {
          res.writeHead(200, {'content-type': 'application/x-www-form-urlencoded'})
          res.end(qs.stringify({id_token: sign({typ: 'JWT'}, {nonce: 'Purest'}, 'signature')}))
        }
        else if (/^\/access_url_error/.test(req.url)) {
          res.writeHead(500, {'content-type': 'application/x-www-form-urlencoded'})
          res.end(qs.stringify({error: 'invalid'}))
        }
      })
      server.listen(5000, done)
    })

    it('access - missing code - response error', async () => {
      var provider = {}
      var authorize = {error: 'invalid'}
      try {
        await oauth2.access(provider, authorize, {})
      }
      catch (err) {
        t.deepEqual(err.error, {error: 'invalid'})
      }
    })
    it('access - missing code - empty response', async () => {
      var provider = {}
      var authorize = {}
      try {
        await oauth2.access(provider, authorize, {})
      }
      catch (err) {
        t.deepEqual(
          err.error,
          {error: 'Grant: OAuth2 missing code parameter'}
        )
      }
    })
    it('access - state mismatch', async () => {
      var provider = {}
      var authorize = {code: 'code', state: 'Purest'}
      var session = {state: 'Grant'}
      try {
        await oauth2.access(provider, authorize, session)
      }
      catch (err) {
        t.deepEqual(err.error, {error: 'Grant: OAuth2 state mismatch'})
      }
    })
    it('access - nonce mismatch', async () => {
      var provider = {access_url: url('/access_url_nonce')}
      var authorize = {code: 'code', nonce: 'Grant'}
      var session = {}
      try {
        await oauth2.access(provider, authorize, session)
      }
      catch (err) {
        t.deepEqual(err.error, {error: 'Grant: OpenID Connect nonce mismatch'})
      }
    })
    it('access - request error', async () => {
      var provider = {access_url: 'compose:5000'}
      var authorize = {code: 'code'}
      try {
        await oauth2.access(provider, authorize, {})
      }
      catch (err) {
        t.ok(/^Protocol "compose:" not supported\. Expected "http:"/.test(err.error))
      }
    })
    it('access - response error', async () => {
      var provider = {access_url: url('/access_url_error')}
      var authorize = {code: 'code'}
      try {
        await oauth2.access(provider, authorize, {})
      }
      catch (err) {
        t.deepEqual(err.error, {error: 'invalid'})
      }
    })

    after((done) => {
      server.close(done)
    })
  })

  describe('custom', () => {
    describe('authorize', () => {
      describe('custom_parameters', () => {
        var config = {}
        for (var key in oauth) {
          var provider = oauth[key]
          if (provider.oauth === 2 && provider.custom_parameters) {
            config[key] = {}
            provider.custom_parameters.forEach((param, index) => {
              config[key][param] = index.toString()
            })
          }
        }
        var grant = Grant(config)

        Object.keys(config).forEach((key) => {
          it(key, async () => {
            var url = await oauth2.authorize(grant.config[key])
            var query = qs.parse(url.split('?')[1])
            delete query.response_type
            delete query.redirect_uri
            t.deepEqual(query, config[key])
          })
        })
      })

      describe('subdomain', () => {
        var config = {}
        for (var key in oauth) {
          var provider = oauth[key]
          if (provider.oauth === 2 && provider.subdomain) {
            config[key] = {subdomain: 'grant'}
          }
        }
        var grant = Grant(config)

        Object.keys(config).forEach((key) => {
          it(key, async () => {
            var url = await oauth2.authorize(grant.config[key])
            if (key !== 'vend') {
              t.ok(/grant/.test(url))
            }
          })
        })
      })

      describe('web_server', () => {
        var config = {basecamp: {}}
        var grant = Grant(config)
        it('basecamp', async () => {
          var url = await oauth2.authorize(grant.config.basecamp)
          var query = qs.parse(url.split('?')[1])
          t.equal(query.type, 'web_server')
        })
      })

      describe('scopes', () => {
        var grant = Grant({
          freelancer: {scope: ['1', '2']},
          optimizely: {scope: ['1', '2']}
        })
        it('freelancer', async () => {
          var url = await oauth2.authorize(grant.config.freelancer)
          var query = qs.parse(url.split('?')[1])
          t.equal(query.advanced_scopes, '1 2')
        })
        it('optimizely', async () => {
          var url = await oauth2.authorize(grant.config.optimizely)
          var query = qs.parse(url.split('?')[1])
          t.equal(query.scopes, '1,2')
        })
      })

      describe('response_type', () => {
        var config = {visualstudio: {response_type: 'Assertion'}}
        var grant = Grant(config)
        it('visualstudio', async () => {
          var url = await oauth2.authorize(grant.config.visualstudio)
          var query = qs.parse(url.split('?')[1])
          t.equal(query.response_type, 'Assertion')
        })
      })

      describe('scopes separated by unencoded + sign', () => {
        var config = {unsplash: {scope: ['public', 'read_photos']}}
        var grant = Grant(config)
        it('unsplash', async () => {
          var url = await oauth2.authorize(grant.config.unsplash)
          t.equal(url.replace(/.*scope=(.*)/g, '$1'), 'public+read_photos')
        })
      })
    })

    describe('access', () => {
      var grant, server

      before((done) => {
        var config = {
          defaults: {protocol: 'http', host: 'localhost:5000', callback: '/'},
          basecamp: {access_url: url('/access_url')},
          concur: {access_url: url('/access_url')},
          ebay: {access_url: url('/access_url')},
          fitbit2: {access_url: url('/access_url')},
          homeaway: {access_url: url('/access_url')},
          hootsuite: {access_url: url('/access_url')},
          qq: {access_url: url('/access_url')},
          reddit: {access_url: url('/access_url')},
          shopify: {access_url: url('/access_url')},
          smartsheet: {access_url: url('/access_url')},
          surveymonkey: {access_url: url('/access_url')},
          visualstudio: {access_url: url('/access_url')},
        }
        grant = Grant(config)
        server = express()
          .use(grant)
          .use(bodyParser.urlencoded({extended: true}))
          .post('/access_url', (req, res) => {
            var code = req.body.code || req.query.code
            // wrong content-type to pass the response formatter
            if (code === 'concur') {
              res.writeHead(200, {'content-type': 'application/json'})
              res.end(qs.stringify(req.query))
              return
            }
            res.writeHead(200, {'content-type': 'application/x-www-form-urlencoded'})
            if (req.url.split('?')[1]) {
              res.end(qs.stringify(req.query))
            }
            else if (req.headers.authorization) {
              res.end(qs.stringify({basic: req.headers.authorization}))
            }
            else if (req.body) {
              res.end(qs.stringify(req.body))
            }
          })
          .get('/access_url', (req, res) => {
            res.writeHead(200, {'content-type': 'application/x-www-form-urlencoded'})
            res.end(qs.stringify(Object.assign({method: req.method}, req.query)))
          })
          .listen(5000, done)
      })

      describe('web_server', () => {
        it('basecamp', async () => {
          var data = await oauth2.access(grant.config.basecamp, {code: 'code'}, {})
          t.equal(data.raw.type, 'web_server')
        })
      })

      describe('qs', () => {
        it('concur', async () => {
          grant.config.concur.key = 'key'
          grant.config.concur.secret = 'secret'
          var data = await oauth2.access(grant.config.concur, {code: 'concur'}, {})
          t.deepEqual(qs.parse(data.raw), {
            code: 'concur', client_id: 'key', client_secret: 'secret'
          })
        })
        it('surveymonkey', async () => {
          grant.config.surveymonkey.custom_params = {api_key: 'api_key'}
          var data = await oauth2.access(grant.config.surveymonkey, {code: 'code'}, {})
          t.deepEqual(qs.parse(data.raw), {api_key: 'api_key'})
        })
      })

      describe('basic auth', () => {
        ;['ebay', 'fitbit2', 'homeaway', 'hootsuite', 'reddit'].forEach((provider) => {
          it(provider, async () => {
            grant.config.ebay.key = 'key'
            grant.config.ebay.secret = 'secret'
            var data = await oauth2.access(grant.config.ebay, {code: 'code'}, {})
            t.deepEqual(
              Buffer.from(data.raw.basic.replace('Basic ', ''), 'base64').toString().split(':'),
              ['key', 'secret']
            )
          })
        })
      })

      describe('get method', () => {
        it('qq', async () => {
          var data = await oauth2.access(grant.config.qq, {code: 'code'}, {})
          t.deepEqual(qs.parse(data.raw), {
            method: 'GET',
            grant_type: 'authorization_code',
            code: 'code',
            redirect_uri: url('/connect/qq/callback')
          })
        })
      })

      describe('hash', () => {
        it('smartsheet', async () => {
          var data = await oauth2.access(grant.config.smartsheet, {code: 'code'}, {})
          t.ok(typeof data.raw.hash === 'string')
        })
      })

      describe('Assertion Framework for OAuth 2.0', () => {
        it('visualstudio', async () => {
          grant.config.visualstudio.secret = 'secret'
          var data = await oauth2.access(grant.config.visualstudio, {code: 'code'}, {})
          t.deepEqual(data.raw, {
            client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            client_assertion: 'secret',
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: 'code',
            redirect_uri: url('/connect/visualstudio/callback')
          })
        })
      })

      describe('subdomain', () => {
        it('shopify', async () => {
          grant.config.shopify.access_url = url('/[subdomain]')
          grant.config.shopify.subdomain = 'access_url'
          var data = await oauth2.access(grant.config.shopify, {code: 'code'}, {})
          t.deepEqual(data.raw, {
            grant_type: 'authorization_code',
            code: 'code',
            redirect_uri: url('/connect/shopify/callback')
          })
        })
      })

      after((done) => {
        server.close(done)
      })
    })
  })
})
