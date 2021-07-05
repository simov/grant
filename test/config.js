
var t = require('assert')
var config = require('../lib/config')


describe('config', () => {

  describe('dcopy', () => {
    it('deep copy', () => {
      var obj = {a: {b: 'c'}}
      var copy = config.dcopy(obj)
      copy.a.b = 'd'
      t.deepEqual(obj, {a: {b: 'c'}})
      t.deepEqual(copy, {a: {b: 'd'}})
    })
    it('filter undefined', () => {
      var obj = {a: 1, b: undefined}
      var copy = config.dcopy(obj)
      t.deepEqual(obj, {a: 1, b: undefined})
      t.deepEqual(copy, {a: 1})
    })
  })

  describe('merge', () => {
    it('deep assign', () => {
      var result = config.merge({a: true, b: 'c'}, {a: false, b: undefined})
      t.deepEqual(result, {a: false, b: 'c'})
    })
    it('filter falsy args', () => {
      var result = config.merge({a: true}, undefined, {a: false})
      t.deepEqual(result, {a: false})
    })
  })

  describe('filter', () => {
    it('empty string', () => {
      var result = config.filter({state: 'grant', nonce: ''})
      t.deepEqual(result, {state: 'grant'})
    })
    it('provider name', () => {
      var result = config.filter({name: 'grant', grant: true, foo: true})
      t.deepEqual(result, {name: 'grant', grant: true})
    })
    it('reserved key', () => {
      var result = config.filter({state: true, foo: true})
      t.deepEqual(result, {state: true})
    })
  })

  describe('format', () => {
    it('oauth', () => {
      t.strictEqual(config.format.oauth({oauth: 2}), 2)
      t.strictEqual(config.format.oauth({oauth: '2'}), 2)
      t.strictEqual(config.format.oauth({oauth: 'foo'}), undefined)
      t.strictEqual(config.format.oauth({}), undefined)
    })
    it('key', () => {
      t.equal(config.format.key({oauth: 1, key: 'key'}), 'key')
      t.equal(config.format.key({oauth: 1, consumer_key: 'key'}), 'key')
      t.equal(config.format.key({oauth: 2, key: 'key'}), 'key')
      t.equal(config.format.key({oauth: 2, client_id: 'key'}), 'key')
      t.equal(config.format.key({oauth: 1}), undefined)
      t.equal(config.format.key({oauth: 2}), undefined)
      t.equal(config.format.key({oauth: 3, key: 'key'}), undefined)
      t.equal(config.format.key({}), undefined)
    })
    it('secret', () => {
      t.equal(config.format.secret({oauth: 1, secret: 'secret'}), 'secret')
      t.equal(config.format.secret({oauth: 1, consumer_secret: 'secret'}), 'secret')
      t.equal(config.format.secret({oauth: 2, secret: 'secret'}), 'secret')
      t.equal(config.format.secret({oauth: 2, client_secret: 'secret'}), 'secret')
      t.equal(config.format.secret({oauth: 1}), undefined)
      t.equal(config.format.secret({oauth: 2}), undefined)
      t.equal(config.format.secret({oauth: 3, secret: 'secret'}), undefined)
      t.equal(config.format.secret({}), undefined)
    })
    it('scope', () => {
      t.equal(config.format.scope({scope: []}), undefined)
      t.equal(config.format.scope({scope: ['']}), undefined)
      t.equal(config.format.scope({scope: ['a', '', 'b']}), 'a,b')
      t.equal(config.format.scope({scope: ['a', 'b'], scope_delimiter: ' '}), 'a b')
      t.equal(config.format.scope({scope: {}}), '{}')
      t.equal(config.format.scope({scope: {a: 'b'}}), '{"a":"b"}')
      t.equal(config.format.scope({scope: 'a,b'}), 'a,b')
      t.equal(config.format.scope({scope: ''}), undefined)
      t.equal(config.format.scope({}), undefined)
    })
    it('state', () => {
      t.equal(config.format.state({state: true}), true)
      t.equal(config.format.state({state: 'state'}), 'state')
      t.equal(config.format.state({state: false}), undefined)
      t.equal(config.format.state({state: ''}), undefined)
      t.equal(config.format.state({}), undefined)
    })
    it('nonce', () => {
      t.equal(config.format.nonce({nonce: true}), true)
      t.equal(config.format.nonce({nonce: 'nonce'}), 'nonce')
      t.equal(config.format.nonce({nonce: false}), undefined)
      t.equal(config.format.nonce({nonce: ''}), undefined)
      t.equal(config.format.nonce({}), undefined)
    })
    it('redirect_uri', () => {
      ;[
        [
          {},
          undefined,
        ],
        [
          {redirect_uri: 'http://localhost:3000/connect/grant/callback'},
          'http://localhost:3000/connect/grant/callback',
        ],
        [
          {origin: 'http://localhost:3000', prefix: '/oauth', name: 'grant'},
          'http://localhost:3000/oauth/grant/callback',
        ],
        [
          {origin: 'http://localhost:3000', prefix: '', name: 'grant'},
          'http://localhost:3000/grant/callback',
        ],
        [
          {protocol: 'https', host: 'outofindex.com', prefix: '/oauth', name: 'grant'},
          'https://outofindex.com/oauth/grant/callback',
        ],
      ].forEach(([provider, result, message]) => {
        t.deepEqual(config.format.redirect_uri(provider), result, message)
      })
    })
    it('custom_params', () => {
      ;[
        [
          {},
          undefined,
          'return undefined by default'
        ],
        [
          {custom_params: {}},
          undefined,
          'return undefined on empty custom_params'
        ],
        [
          {custom_params: {a: 1, b: 2}},
          {a: 1, b: 2},
          'return custom_params'
        ]
      ].forEach(([provider, result, message]) => {
        t.deepEqual(config.format.custom_params(provider), result, message)
      })
    })
    it('overrides', () => {
      ;[
        [
          {},
          undefined,
          'return undefined by default'
        ],
        [
          {overrides: {}},
          undefined,
          'return undefined on empty overrides'
        ],
        [
          {overrides: {a: {scope: 1}}},
          {a: {scope: 1}},
          'return overrides'
        ],
        [
          {overrides: {a: {scope: 1, overrides: {b: {scope: 1}}}}},
          {a: {scope: 1}},
          'filter out nested overrides'
        ],
      ].forEach(([provider, result, message]) => {
        t.deepEqual(config.format.overrides(provider), result, message)
      })
    })
  })

  describe('state', () => {
    it('state', () => {
      t.equal(config.state({state: '123'}), '123')
      t.equal(config.state({state: 123}), '123')
      t.ok(/^[a-f0-9]+/.test(config.state({state: true})))
      t.ok(/^[a-f0-9]+/.test(config.state({state: 'true'})))
      t.equal(config.state({state: false}), undefined)
      t.equal(config.state({state: 'false'}), undefined)
      t.equal(config.state({}), undefined)
    })
    it('nonce', () => {
      t.equal(config.state({nonce: '123'}, 'nonce'), '123')
      t.equal(config.state({nonce: 123}, 'nonce'), '123')
      t.ok(/^[a-f0-9]+/.test(config.state({nonce: true}, 'nonce')))
      t.ok(/^[a-f0-9]+/.test(config.state({nonce: 'true'}, 'nonce')))
      t.equal(config.state({nonce: false}, 'nonce'), undefined)
      t.equal(config.state({nonce: 'false'}, 'nonce'), undefined)
      t.equal(config.state({}, 'nonce'), undefined)
    })
  })

  describe('pkce', () => {
    it('pkce', () => {
      var {code_verifier, code_challenge} = config.pkce()
      t.ok(typeof code_verifier === 'string')
      t.ok(/[a-z0-9]{80}/.test(code_verifier))
      t.ok(typeof code_challenge === 'string')
      t.equal(code_challenge.length, 43)
    })
  })

  describe('transform', () => {
    it('transform', () => {
      t.deepEqual(
        config.transform({
          origin: 'http://localhost:3000', prefix: '/oauth',
          oauth: 2, client_id: 'key', client_secret: 'secret',
          state: true, nonce: false,
          custom_params: {team: 'github'},
          dynamic: ['scope'],
          overrides: {
            sub: {state: false, nonce: true, dynamic: ['callback']}
          },
          name: 'github', github: true
        }),
        {
          origin: 'http://localhost:3000', prefix: '/oauth',
          oauth: 2, key: 'key', secret: 'secret',
          client_id: 'key', client_secret: 'secret',
          state: true,
          custom_params: {team: 'github'},
          dynamic: ['scope'],
          redirect_uri: 'http://localhost:3000/oauth/github/callback',
          name: 'github', github: true,
          overrides: {
            sub: {
              origin: 'http://localhost:3000', prefix: '/oauth',
              oauth: 2, key: 'key', secret: 'secret',
              client_id: 'key', client_secret: 'secret',
              nonce: true,
              dynamic: ['callback'],
              custom_params: {team: 'github'},
              redirect_uri: 'http://localhost:3000/oauth/github/callback',
              name: 'github', github: true,
            }
          }
        }
      )
    })
  })

  describe('compat', () => {
    it('fitbit2 - oauth1 to oauth2', () => {
      var input = {fitbit2: {key: 'key', secret: 'secret'}}
      var output = config.compat(input)
      t.deepEqual(
        input,
        {fitbit2: {key: 'key', secret: 'secret'}},
        'input config should be unchanged'
      )
      t.deepEqual(
        output, {
          fitbit2: {
            authorize_url: 'https://www.fitbit.com/oauth2/authorize',
            access_url: 'https://api.fitbit.com/oauth2/token',
            profile_url: 'https://api.fitbit.com/1/user/-/profile.json',
            oauth: 2,
            scope_delimiter: ' ',
            key: 'key',
            secret: 'secret'
           }
         },
        'output config should be merged with oauth.fitbit'
      )
    })
    it('linkedin2 - oauth1 to oauth2', () => {
      var input = {linkedin2: {key: 'key', secret: 'secret'}}
      var output = config.compat(input)
      t.deepEqual(
        input,
        {linkedin2: {key: 'key', secret: 'secret'}},
        'input config should be unchanged'
      )
      t.deepEqual(
        output, {
          linkedin2: {
            authorize_url: 'https://www.linkedin.com/oauth/v2/authorization',
            access_url: 'https://www.linkedin.com/oauth/v2/accessToken',
            profile_url: 'https://api.linkedin.com/v2/me',
            oauth: 2,
            scope_delimiter: ' ',
            key: 'key',
            secret: 'secret'
           }
         },
        'output config should be merged with oauth.linkedin'
      )
    })
    it('zeit - zeit to vercel', () => {
      var input = {zeit: {key: 'key', secret: 'secret'}}
      var output = config.compat(input)
      t.deepEqual(
        input,
        {zeit: {key: 'key', secret: 'secret'}},
        'input config should be unchanged'
      )
      t.deepEqual(
        output, {
          zeit: {
            authorize_url: 'https://vercel.com/oauth/authorize',
            access_url: 'https://api.vercel.com/v2/oauth/access_token',
            profile_url: 'https://api.vercel.com/www/user',
            oauth: 2,
            key: 'key',
            secret: 'secret'
           }
         },
        'output config should be merged with oauth.vercel'
      )
    })
  })

  describe('ctor', () => {
    it('defaults', () => {
      var defaults = config({
        defaults: {protocol: 'http', host: 'localhost:3000'},
        facebook: {state: true, scope: ['openid']}
      })
      t.deepEqual(defaults, {
        defaults: {protocol: 'http', host: 'localhost:3000', prefix: '/connect'},
        facebook: {
          authorize_url: 'https://www.facebook.com/dialog/oauth',
          access_url: 'https://graph.facebook.com/oauth/access_token',
          profile_url: 'https://graph.facebook.com/me',
          oauth: 2,
          protocol: 'http', host: 'localhost:3000', prefix: '/connect',
          state: true,
          scope: 'openid',
          redirect_uri: 'http://localhost:3000/connect/facebook/callback',
          name: 'facebook', facebook: true
        }
      })
    })
    it('no defaults', () => {
      var nodefaults = config({
        facebook: {
          protocol: 'http', host: 'localhost:3000',
          state: true, scope: ['openid']
        }
      })
      t.deepEqual(nodefaults, {
        defaults: {prefix: '/connect'},
        facebook: {
          authorize_url: 'https://www.facebook.com/dialog/oauth',
          access_url: 'https://graph.facebook.com/oauth/access_token',
          profile_url: 'https://graph.facebook.com/me',
          oauth: 2,
          protocol: 'http', host: 'localhost:3000', prefix: '/connect',
          state: true,
          scope: 'openid',
          redirect_uri: 'http://localhost:3000/connect/facebook/callback',
          name: 'facebook', facebook: true
        }
      })
    })
  })

  describe('defaults', () => {
    it('prefix', () => {
      ;[
        [
          {},
          {prefix: '/connect'}
        ],
        [
          {prefix: '/oauth'},
          {prefix: '/oauth'}
        ],
        [
          {path: '/api'},
          {prefix: '/api/connect'}
        ],
        [
          {path: '/api', prefix: '/oauth'},
          {prefix: '/api/oauth'}
        ]
      ].forEach(([provider, result, message]) => {
        t.deepEqual(config.defaults(provider), result, message)
      })
    })
  })

  describe('provider', () => {
    it('preconfigured', () => {
      var options = config({defaults: {}, grant: {}})
      var session = {provider: 'grant'}
      t.deepEqual(
        config.provider(options, session),
        {
          prefix: '/connect', name: 'grant', grant: true
        }
      )
    })
    it('dynamic provider - defaults to false', () => {
      var options = config({})
      var session = {provider: 'grant'}
      t.deepEqual(
        config.provider(options, session),
        {}
      )
    })
    it('dynamic provider - existing in oauth.json', () => {
      var options = config({defaults: {dynamic: true}})
      var session = {provider: 'facebook'}
      t.deepEqual(
        config.provider(options, session), {
          authorize_url: 'https://www.facebook.com/dialog/oauth',
          access_url: 'https://graph.facebook.com/oauth/access_token',
          profile_url: 'https://graph.facebook.com/me',
          oauth: 2,
          prefix: '/connect',
          dynamic: true,
          name: 'facebook',
          facebook: true
        }
      )
    })
    it('dynamic provider - not existing in oauth.json', () => {
      var options = config({defaults: {dynamic: true}})
      var session = {provider: 'grant'}
      t.deepEqual(
        config.provider(options, session),
        {
          dynamic: true,
          prefix: '/connect', name: 'grant', grant: true
        }
      )
    })
    it('static override', () => {
      var options = config({grant: {overrides: {sub: {state: 'purest'}}}})
      var session = {provider: 'grant', override: 'sub'}
      t.deepEqual(
        config.provider(options, session),
        {
          state: 'purest',
          prefix: '/connect', name: 'grant', grant: true
        }
      )
    })
    it('dynamic params - true', () => {
      var options = config({grant: {dynamic: true, state: 'grant'}})
      var session = {provider: 'grant', dynamic: {state: 'purest'}}
      t.deepEqual(
        config.provider(options, session),
        {
          dynamic: true, state: 'purest',
          prefix: '/connect', name: 'grant', grant: true
        }
      )
      t.deepEqual(
        options,
        {
          defaults: {prefix: '/connect'},
          grant: {
            dynamic: true, state: 'grant',
            prefix: '/connect', name: 'grant', grant: true
          }
        }
      )
    })
    it('dynamic params - array', () => {
      var options = config({grant: {dynamic: ['state'], state: 'grant', scope: 'grant'}})
      var session = {provider: 'grant', dynamic: {state: 'purest', scope: 'purest'}}
      t.deepEqual(
        config.provider(options, session),
        {
          dynamic: ['state'], state: 'purest', scope: 'grant',
          prefix: '/connect', name: 'grant', grant: true
        }
      )
      t.deepEqual(
        options,
        {
          defaults: {prefix: '/connect'},
          grant: {
            dynamic: ['state'], state: 'grant', scope: 'grant',
            prefix: '/connect', name: 'grant', grant: true
          }
        }
      )
    })
    it('state - dynamic', () => {
      var options = config({grant: {}})
      var session = {provider: 'grant'}
      var state = {dynamic: {state: 's1'}}
      t.deepEqual(
        config.provider(options, session, state),
        {
          state: 's1',
          prefix: '/connect', name: 'grant', grant: true
        }
      )
      t.deepEqual(
        options,
        {
          defaults: {prefix: '/connect'},
          grant: {prefix: '/connect', name: 'grant', grant: true}
        }
      )
    })
    it('state - dynamic + session dynamic', () => {
      var options = config({grant: {oauth: 2, dynamic: ['state', 'scope']}})
      var session = {provider: 'grant', dynamic:
        {key: 'session', secret: 'session', state: 'session', scope: ['session']}}
      var state = {dynamic: {key: 'state', secret: 'state', state: 'state'}}
      t.deepEqual(
        config.provider(options, session, state),
        {
          oauth: 2, dynamic: ['state', 'scope'],
          key: 'state', secret: 'state', state: 'session', scope: 'session',
          prefix: '/connect', name: 'grant', grant: true
        }
      )
      t.deepEqual(
        options,
        {
          defaults: {prefix: '/connect'},
          grant: {
            oauth: 2, dynamic: ['state', 'scope'],
            prefix: '/connect', name: 'grant', grant: true
          }
        }
      )
    })
    it('state', () => {
      var options = config({grant: {state: true}})
      var session = {provider: 'grant'}
      var result = config.provider(options, session)
      t.ok(/^[a-fA-F0-9]+$/.test(result.state))
      t.deepEqual(
        options,
        {
          defaults: {prefix: '/connect'},
          grant: {
            state: true,
            prefix: '/connect', name: 'grant', grant: true
          }
        }
      )
    })
    it('nonce', () => {
      var options = config({grant: {nonce: true}})
      var session = {provider: 'grant'}
      var result = config.provider(options, session)
      t.ok(/^[a-fA-F0-9]+$/.test(result.nonce))
      t.deepEqual(
        options,
        {
          defaults: {prefix: '/connect'},
          grant: {
            nonce: true,
            prefix: '/connect', name: 'grant', grant: true
          }
        }
      )
    })
    it('pkce', () => {
      var options = config({grant: {pkce: true}})
      var session = {provider: 'grant'}
      var result = config.provider(options, session)
      t.ok(typeof result.code_verifier === 'string')
      t.ok(/^[a-z0-9]{80}$/.test(result.code_verifier))
      t.ok(typeof result.code_challenge === 'string')
      t.equal(result.code_challenge.length, 43)
      t.deepEqual(
        options,
        {
          defaults: {prefix: '/connect'},
          grant: {
            pkce: true,
            prefix: '/connect', name: 'grant', grant: true
          }
        }
      )
    })
  })

})
