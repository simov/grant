
var t = require('assert')
var qs = require('qs')

var request = require('request-compose').extend({
  Request: {cookie: require('request-cookie').Request},
  Response: {cookie: require('request-cookie').Response},
}).client

var oauth = require('../../config/oauth')

var Provider = require('../util/provider'), provider
var Client = require('../util/client'), client


describe('oauth2', () => {
  before(async () => {
    provider = await Provider({flow: 'oauth2'})
    client = await Client({
      test: 'handlers',
      handler: 'express',
      config: {
        defaults: {
          origin: 'http://localhost:5001',
          callback: '/',
        },
        ...Object.keys(oauth).reduce((all, name) => (all[name] = {
          authorize_url: provider.url(`/${name}/authorize_url`),
          access_url: provider.url(`/${name}/access_url`),
          dynamic: true,
        }, all), {})
      }
    })
  })

  after(async () => {
    await client.close()
    await provider.close()
  })

  afterEach(() => {
    provider.on.authorize = () => {}
    provider.on.access = () => {}
  })

  describe('success', () => {
    it('google', async () => {
      provider.on.authorize = ({url, headers, query}) => {
        t.ok(url.startsWith('/google/authorize_url'))
        t.equal(typeof headers, 'object')
        t.deepEqual(query, {
          response_type: 'code',
          redirect_uri: 'http://localhost:5001/connect/google/callback'
        })
      }
      provider.on.access = ({url, headers, query, form}) => {
        t.equal(url, '/google/access_url')
        t.equal(headers['content-type'], 'application/x-www-form-urlencoded')
        t.deepEqual(form, {
          grant_type: 'authorization_code',
          code: 'code',
          redirect_uri: 'http://localhost:5001/connect/google/callback'
        })
      }
      var {body: {response}} = await request({
        url: client.url('/connect/google'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })
  })

  describe('subdomain', () => {
    it('auth0', async () => {
      provider.on.authorize = ({url, headers, query}) => {
        t.ok(url.startsWith('/auth0/authorize_url'))
      }
      provider.on.access = ({url, headers, query, form}) => {
        t.ok(url.startsWith('/auth0/access_url'))
      }
      var {body: {response}} = await request({
        url: client.url('/connect/auth0'),
        qs: {
          authorize_url: provider.url('/[subdomain]/authorize_url'),
          access_url: provider.url('/[subdomain]/access_url'),
          subdomain: 'auth0',
        },
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })
  })

  describe('custom', () => {
    it('authorize - user - apple', async () => {
      provider.on.authorize = ({url, headers, query}) => {
        t.equal(query.response_mode, 'form_post')
      }
      var cookie = {}
      var {body:form} = await request({
        url: client.url('/connect/apple'),
        // request-compose:querystring can't handle nested objects
        qs: qs.stringify({
          custom_params: {response_mode: 'form_post'},
          response: ['tokens', 'raw', 'profile'],
        }),
        cookie,
      })
      var {body: {response}} = await request({
        method: 'POST',
        url: client.url('/connect/apple/callback'),
        form,
        cookie,
        redirect: {all: true, method: false}
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'},
        profile: {name: {firstName: 'jon', lastName: 'doe'}, email: 'jon@doe.com'}
      })
    })

    it('authorize - profile_url - apple', async () => {
      provider.on.authorize = ({url, headers, query}) => {
        t.equal(query.response_mode, 'form_post')
      }
      var cookie = {}
      var {body:form} = await request({
        url: client.url('/connect/apple'),
        // request-compose:querystring can't handle nested objects
        qs: qs.stringify({
          custom_params: {response_mode: 'form_post'},
          response: ['tokens', 'raw', 'profile'],
          profile_url: provider.url('/profile_url')
        }),
        cookie,
      })
      var {body: {response}} = await request({
        method: 'POST',
        url: client.url('/connect/apple/callback'),
        form,
        cookie,
        redirect: {all: true, method: false}
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'},
        profile: {user: 'simov'}
      })
    })

    it('authorize - web_server - basecamp', async () => {
      provider.on.authorize = ({url, headers, query}) => {
        t.equal(query.type, 'web_server')
      }
      var {body: {response}} = await request({
        url: client.url('/connect/basecamp'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })

    it('authorize - scopes - freelancer', async () => {
      provider.on.authorize = ({url, headers, query}) => {
        t.equal(query.advanced_scopes, '1 2')
      }
      var {body: {response}} = await request({
        url: client.url('/connect/freelancer'),
        qs: {scope: ['1', '2']},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })

    it('authorize - scopes - optimizely', async () => {
      provider.on.authorize = ({url, headers, query}) => {
        t.equal(query.scopes, '1,2')
      }
      var {body: {response}} = await request({
        url: client.url('/connect/optimizely'),
        qs: {scope: ['1', '2']},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })

    it('authorize - client_key/client_id - tiktok', async () => {
      provider.on.authorize = ({query}) => {
        t.equal(query.client_id, undefined)
        t.equal(query.client_key, 'key')
      }
      var {body: {response}} = await request({
        url: client.url('/connect/tiktok'),
        qs: {key: 'key'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600', open_id: 'id'}
      })
    })

    it('authorize - response_type - visualstudio', async () => {
      provider.on.authorize = ({url, headers, query}) => {
        t.equal(query.response_type, 'Assertion')
      }
      var {body: {response}} = await request({
        url: client.url('/connect/visualstudio'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })

    it('authorize - scopes separated by unencoded + sign - unsplash', async () => {
      provider.on.authorize = ({url, headers, query}) => {
        t.equal(url.replace(/.*scope=(.*)/g, '$1'), 'public+read_photos')
      }
      var {body: {response}} = await request({
        url: client.url('/connect/unsplash'),
        qs: {scope: ['public', 'read_photos']},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })

    it('authorize - app_id/client_id, access - app_id/app_secret -> client_id/client_secret - instagram v1', async () => {
      provider.on.authorize = ({url, headers, query}) => {
        t.equal(query.client_id, '00cd22b35e8e42c0a29d1d71236f5c1d')
        t.equal(query.app_id, undefined)
        t.equal(query.scope, 'a b')
      }
      provider.on.access = ({url, headers, query, form}) => {
        t.deepEqual(form, {
          grant_type: 'authorization_code',
          code: 'code',
          client_id: '00cd22b35e8e42c0a29d1d71236f5c1d',
          client_secret: 'secret',
          redirect_uri: 'http://localhost:5001/connect/instagram/callback'
        })
      }
      var {body: {response}} = await request({
        url: client.url('/connect/instagram'),
        qs: {key: '00cd22b35e8e42c0a29d1d71236f5c1d', secret: 'secret', scope: 'a b'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })

    it('authorize - app_id/client_id, access - app_id/app_secret -> client_id/client_secret - instagram graph', async () => {
      provider.on.authorize = ({url, headers, query}) => {
        t.equal(query.app_id, '771866756573877')
        t.equal(query.client_id, undefined)
        t.equal(query.scope, 'a,b')
      }
      provider.on.access = ({url, headers, query, form}) => {
        t.deepEqual(form, {
          grant_type: 'authorization_code',
          code: 'code',
          app_id: '771866756573877',
          app_secret: 'secret',
          redirect_uri: 'http://localhost:5001/connect/instagram/callback'
        })
      }
      var {body: {response}} = await request({
        url: client.url('/connect/instagram'),
        qs: {key: '771866756573877', secret: 'secret', scope: 'a b'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })

    it('authorize - app_id/client_id - instagram graph - no scope', async () => {
      provider.on.authorize = ({url, headers, query}) => {
        t.equal(query.app_id, '771866756573877')
        t.equal(query.client_id, undefined)
        t.equal(query.scope, undefined)
      }
      var {body: {response}} = await request({
        url: client.url('/connect/instagram'),
        qs: {key: '771866756573877', secret: 'secret'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })

    it('authorize - appid/client_id - wechat', async () => {
      provider.on.authorize = ({url, headers, query}) => {
        t.equal(query.appid, 'key')
        t.equal(query.client_id, undefined)
      }
      var {body: {response}} = await request({
        url: client.url('/connect/wechat'),
        qs: {key: 'key', secret: 'secret'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600', openid: 'openid'}
      })
    })

    it('access - web_server - basecamp', async () => {
      provider.on.access = ({url, headers, query, form}) => {
        t.equal(form.type, 'web_server')
      }
      var {body: {response}} = await request({
        url: client.url('/connect/basecamp'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })

    it('access - qs - concur', async () => {
      provider.on.access = ({url, headers, query, form}) => {
        t.deepEqual(query, {code: 'code', client_id: 'key', client_secret: 'secret'})
      }
      var {body: {response}} = await request({
        url: client.url('/connect/concur'),
        qs: {key: 'key', secret: 'secret'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: ' <Token>token</Token> <Refresh_Token>refresh</Refresh_Token> '
      })
    })

    it('access - qs - surveymonkey', async () => {
      provider.on.access = ({url, headers, query, form}) => {
        t.equal(query.api_key, 'api_key')
      }
      var {body: {response}} = await request({
        url: client.url('/connect/surveymonkey'),
        // request-compose:querystring can't handle nested objects
        qs: 'custom_params%5Bapi_key%5D=api_key',
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })

    it('access - client_key/client_id - tiktok', async () => {
      provider.on.access = ({form}) => {
        t.equal(form.client_id, undefined)
        t.equal(form.client_key, 'key')
      }
      var {body: {response}} = await request({
        url: client.url('/connect/tiktok'),
        qs: {key: 'key'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600', open_id: 'id'}
      })
    })

    it('access - basic auth', async () => {
      provider.on.access = ({provider, url, headers, query, form}) => {
        t.deepEqual(
          Buffer.from(headers.authorization.replace('Basic ', ''), 'base64').toString().split(':'),
          ['key', 'secret']
        )
        t.deepEqual(form, {
          grant_type: 'authorization_code',
          code: 'code',
          redirect_uri: client.url(`/connect/${provider}/callback`)
        })
      }
      await Promise.all(
        ['autodesk', 'ebay', 'fitbit', 'homeaway', 'hootsuite', 'notion', 'reddit', 'trustpilot'].map((provider) =>
          request({
            url: client.url(`/connect/${provider}`),
            qs: {key: 'key', secret: 'secret'},
            cookie: {},
          })
        )
      ).then((responses) => responses.forEach(({body: {response}}) => {
        t.deepEqual(response, {
          access_token: 'token',
          refresh_token: 'refresh',
          raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
        })
      }))
    })
    it('access - basic auth - token_endpoint_auth_method -> client_secret_basic', async () => {
      provider.on.access = ({provider, url, headers, query, form}) => {
        t.deepEqual(
          Buffer.from(headers.authorization.replace('Basic ', ''), 'base64').toString().split(':'),
          ['key', 'secret']
        )
        t.deepEqual(form, {
          grant_type: 'authorization_code',
          code: 'code',
          redirect_uri: client.url(`/connect/${provider}/callback`)
        })
      }
      var {body: {response}} = await request({
        url: client.url('/connect/google'),
        qs: {key: 'key', secret: 'secret', token_endpoint_auth_method: 'client_secret_basic'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })
    it('access - basic auth - twitter2', async () => {
      provider.on.access = ({provider, url, headers, query, form}) => {
        t.deepEqual(
          Buffer.from(headers.authorization.replace('Basic ', ''), 'base64').toString().split(':'),
          ['key', 'secret']
        )
        t.deepEqual(form, {
          grant_type: 'authorization_code',
          code: 'code',
          client_id: 'key',
          redirect_uri: client.url(`/connect/${provider}/callback`)
        })
      }
      var {body: {response}} = await request({
        url: client.url('/connect/twitter2'),
        qs: {key: 'key', secret: 'secret'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })

    it('access - JSON encoded body - notion', async () => {
      provider.on.access = ({method, url, headers, query, form}) => {
        t.deepEqual(
          Buffer.from(headers.authorization.replace('Basic ', ''), 'base64').toString().split(':'),
          ['key', 'secret']
        )
        t.deepEqual(form, {
          grant_type: 'authorization_code',
          code: 'code',
          redirect_uri: 'http://localhost:5001/connect/notion/callback'
        })
      }
      var {body: {response}} = await request({
        url: client.url('/connect/notion'),
        qs: {key: 'key', secret: 'secret'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })

    it('access - GET - qq', async () => {
      provider.on.access = ({method, url, headers, query, form}) => {
        t.equal(method, 'GET')
        t.deepEqual(query, {
          grant_type: 'authorization_code',
          code: 'code',
          redirect_uri: client.url('/connect/qq/callback')
        })
      }
      var {body: {response}} = await request({
        url: client.url('/connect/qq'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })

    it('access - GET - untappd', async () => {
      provider.on.access = ({method, url, headers, query, form}) => {
        t.equal(method, 'GET')
        t.deepEqual(query, {
          response_type: 'code',
          code: 'code',
          redirect_uri: client.url('/connect/untappd/callback')
        })
      }
      var {body: {response}} = await request({
        url: client.url('/connect/untappd'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })

    it('access - GET + qs + custom params - wechat', async () => {
      provider.on.access = ({method, url, headers, query, form}) => {
        t.equal(method, 'GET')
        t.deepEqual(query, {
          grant_type: 'authorization_code',
          code: 'code',
          appid: 'key',
          secret: 'secret',
          redirect_uri: 'http://localhost:5001/connect/wechat/callback'
        })
      }
      var {body: {response}} = await request({
        url: client.url('/connect/wechat'),
        qs: {key: 'key', secret: 'secret'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600', openid: 'openid'}
      })
    })

    it('access - hash - smartsheet', async () => {
      provider.on.access = ({url, headers, query, form}) => {
        t.deepEqual(form, {
          grant_type: 'authorization_code',
          code: 'code',
          hash: '3dc1bef34740659fb7395d85e501168e2314ba6df88af1a853dbdc03abb2411b',
          redirect_uri: 'http://localhost:5001/connect/smartsheet/callback'
        })
      }
      var {body: {response}} = await request({
        url: client.url('/connect/smartsheet'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })

    it('access - Assertion Framework for OAuth 2.0 - visualstudio', async () => {
      provider.on.access = ({url, headers, query, form}) => {
        t.deepEqual(form, {
          client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
          client_assertion: 'secret',
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: 'code',
          redirect_uri: 'http://localhost:5001/connect/visualstudio/callback'
        })
      }
      var {body: {response}} = await request({
        url: client.url('/connect/visualstudio'),
        qs: {secret: 'secret'},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })

    it('access - realmId - intuit', async () => {
      var {body: {response}} = await request({
        url: client.url('/connect/intuit'),
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600', realmId: '123'}
      })
    })

    it('access - action + response - withings', async () => {
      provider.on.access = ({url, headers, query, form}) => {
        t.deepEqual(form, {
          action: 'requesttoken',
          grant_type: 'authorization_code',
          code: 'code',
          redirect_uri: 'http://localhost:5001/connect/withings/callback',
        })
      }
      var {body: {response}} = await request({
        url: client.url('/connect/withings'),
        qs: {access_url: provider.url(`/withings/access_url_wbsapi`)},
        cookie: {},
      })
      t.deepEqual(response, {
        access_token: 'token',
        refresh_token: 'refresh',
        raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
      })
    })
  })

  describe('error', () => {
    it('authorize - missing code with response message', async () => {
      var {body: {response}} = await request({
        url: client.url('/connect/google'),
        qs: {authorize_url: provider.url('/authorize_error_message')},
        cookie: {},
      })
      t.deepEqual(response, {error: {message: 'invalid'}})
    })

    it('authorize - missing code without response message', async () => {
      var {body: {response}} = await request({
        url: client.url('/connect/google'),
        qs: {authorize_url: provider.url('/authorize_error_code')},
        cookie: {},
      })
      t.deepEqual(response, {error: 'Grant: OAuth2 missing code parameter'})
    })

    it('authorize - state mismatch', async () => {
      provider.on.authorize = ({url, headers, query}) => {
        t.equal(query.state.length, 40)
      }
      var {body: {response}} = await request({
        url: client.url('/connect/google'),
        qs: {
          authorize_url: provider.url('/authorize_error_state_mismatch'),
          state: true
        },
        cookie: {},
      })
      t.deepEqual(response, {error: 'Grant: OAuth2 state mismatch'})
    })

    it('authorize - state missing', async () => {
      provider.on.authorize = ({url, headers, query}) => {
        t.equal(query.state.length, 40)
      }
      var {body: {response}} = await request({
        url: client.url('/connect/google'),
        qs: {
          authorize_url: provider.url('/authorize_error_state_missing'),
          state: true
        },
        cookie: {},
      })
      t.deepEqual(response, {error: 'Grant: OAuth2 state mismatch'})
    })

    it('access - nonce mismatch', async () => {
      provider.on.authorize = ({url, headers, query}) => {
        t.equal(query.nonce.length, 40)
      }
      var {body: {response}} = await request({
        url: client.url('/connect/google'),
        qs: {
          access_url: provider.url('/access_error_nonce_mismatch'),
          nonce: true
        },
        cookie: {},
      })
      t.deepEqual(response, {error: 'Grant: OpenID Connect nonce mismatch'})
    })

    it('access - nonce missing', async () => {
      provider.on.authorize = ({url, headers, query}) => {
        t.equal(query.nonce.length, 40)
      }
      var {body: {response}} = await request({
        url: client.url('/connect/google'),
        qs: {
          access_url: provider.url('/access_error_nonce_missing'),
          nonce: true
        },
        cookie: {},
      })
      t.deepEqual(response, {error: 'Grant: OpenID Connect nonce mismatch'})
    })

    it('access - error response', async () => {
      var {body: {response}} = await request({
        url: client.url('/connect/google'),
        qs: {
          access_url: provider.url('/access_error_message'),
        },
        cookie: {},
      })
      t.deepEqual(response, {error: {message: 'invalid'}})
    })

    it('access - error status', async () => {
      var {body: {response}} = await request({
        url: client.url('/connect/google'),
        qs: {
          access_url: provider.url('/access_error_status'),
        },
        cookie: {},
      })
      t.deepEqual(response, {error: {invalid: 'access_url'}})
    })
  })
})
