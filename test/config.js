
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
    it('custom_parameters', () => {
      var result = config.filter({custom_parameters: ['foo'], foo: true})
      t.deepEqual(result, {custom_parameters: ['foo'], foo: true})
    })
    it('static overrides', () => {
      var result = config.filter({obj: {}})
      t.deepEqual(result, {obj: {}})
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
          {protocol: 'https', host: 'outofindex.com', name: 'grant'},
          'https://outofindex.com/connect/grant/callback',
        ],
        [
          {protocol: 'https', host: 'outofindex.com', path: '/prefix', name: 'grant'},
          'https://outofindex.com/prefix/connect/grant/callback',
        ]
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
          {custom_parameters: ['name'], name: 'grant'},
          undefined,
          'filter out reserved keys'
        ],
        [
          {custom_parameters: ['grant'], name: 'grant', grant: true},
          undefined,
          'filter out provider name set as key'
        ],
        [
          {custom_parameters: ['a'], a: {}},
          undefined,
          'filter out object keys'
        ],
        [
          {custom_parameters: ['a'], a: '', custom_params: {b: ''}},
          undefined,
          'filter out falsy values'
        ],
        [
          {custom_parameters: ['a', 'b'], a: 1, b: 2, custom_params: {b: 3, c: 4}},
          {a: 1, b: 3, c: 4},
          'custom_params override custom_parameters'
        ],
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
          {name: {a: 1}},
          undefined,
          'filter out reserved keys'
        ],
        [
          {name: 'grant', grant: {a: 1}},
          undefined,
          'filter out provider name set as key'
        ],
        [
          {a: 1, b: 2},
          undefined,
          'filter out non object keys'
        ],
        [
          {a: {dynamic: [1]}, b: {dynamic: [2]}, overrides: {b: {dynamic: [3]}, c: {dynamic: [4]}}},
          {a: {dynamic: [1]}, b: {dynamic: [3]}, c: {dynamic: [4]}},
          'overrides override direct object keys'
        ],
        [
          {a: {nested: {scope: 1}}, overrides: {b: {nested: {scope: 2}, overrides: {c: {scope: 3}}}}},
          {a: {}, b: {}},
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
      t.ok(/^[a-fA-F0-9]+/.test(config.state({state: true})))
      t.equal(config.state({state: false}), undefined)
      t.equal(config.state({}), undefined)
    })
    it('nonce', () => {
      t.equal(config.state({nonce: '123'}, 'nonce'), '123')
      t.equal(config.state({nonce: 123}, 'nonce'), '123')
      t.ok(/^[a-fA-F0-9]+/.test(config.state({nonce: true}, 'nonce')))
      t.equal(config.state({nonce: false}, 'nonce'), undefined)
      t.equal(config.state({}, 'nonce'), undefined)
    })
  })

  describe('transform', () => {
    it('transform', () => {
      t.deepEqual(
        config.transform({
          protocol: 'http', host: 'localhost:3000',
          oauth: '2', client_id: 'key', client_secret: 'secret',
          state: true, nonce: false,
          custom_parameters: ['team'], team: 'github',
          sub: {state: false, nonce: false}
        }),
        {
          protocol: 'http',
          host: 'localhost:3000',
          oauth: 2,
          client_id: 'key',
          client_secret: 'secret',
          state: true,
          custom_parameters: ['team'],
          key: 'key',
          secret: 'secret',
          custom_params: {team: 'github'},
          overrides: {
            sub: {
              protocol: 'http',
              host: 'localhost:3000',
              oauth: 2,
              client_id: 'key',
              client_secret: 'secret',
              custom_parameters: ['team'],
              key: 'key',
              secret: 'secret',
              custom_params: {team: 'github'}
            }
          }
        }
      )
    })
  })

  describe('ctor', () => {
    it('defaults', () => {
      var defaults = config({
        defaults: {protocol: 'http', host: 'localhost:3000'},
        facebook: {state: true, scope: ['openid']}
      })
      var server = config({
        defaults: {protocol: 'http', host: 'localhost:3000'},
        facebook: {state: true, scope: ['openid']}
      })
      t.deepEqual(defaults, server)
      t.deepEqual(defaults, {
        defaults: {protocol: 'http', host: 'localhost:3000'},
        facebook: {
          authorize_url: 'https://www.facebook.com/dialog/oauth',
          access_url: 'https://graph.facebook.com/oauth/access_token',
          oauth: 2,
          protocol: 'http',
          host: 'localhost:3000',
          state: true,
          scope: 'openid',
          name: 'facebook',
          facebook: true,
          redirect_uri: 'http://localhost:3000/connect/facebook/callback'
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
        facebook: {
          authorize_url: 'https://www.facebook.com/dialog/oauth',
          access_url: 'https://graph.facebook.com/oauth/access_token',
          oauth: 2,
          protocol: 'http',
          host: 'localhost:3000',
          state: true,
          scope: 'openid',
          name: 'facebook',
          facebook: true,
          redirect_uri: 'http://localhost:3000/connect/facebook/callback'
        }
      })
    })
  })

  describe('provider', () => {
    it('preconfigured', () => {
      var options = config({defaults: {}, grant: {}})
      var session = {provider: 'grant'}
      t.deepEqual(
        config.provider(options, session),
        {name: 'grant', grant: true}
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
          oauth: 2,
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
        {dynamic: true, name: 'grant', grant: true}
      )
    })
    it('static override', () => {
      var options = config({grant: {sub: {state: 'purest'}}})
      var session = {provider: 'grant', override: 'sub'}
      t.deepEqual(
        config.provider(options, session),
        {name: 'grant', grant: true, state: 'purest'}
      )
    })
    it('dynamic params - true', () => {
      var options = config({grant: {dynamic: true, state: 'grant'}})
      var session = {provider: 'grant', dynamic: {state: 'purest'}}
      t.deepEqual(
        config.provider(options, session),
        {dynamic: true, name: 'grant', grant: true, state: 'purest'}
      )
      t.deepEqual(
        options,
        {grant: {dynamic: true, name: 'grant', grant: true, state: 'grant'}}
      )
    })
    it('dynamic params - array', () => {
      var options = config({grant: {dynamic: ['state'], state: 'grant', scope: 'grant'}})
      var session = {provider: 'grant', dynamic: {state: 'purest', scope: 'purest'}}
      t.deepEqual(
        config.provider(options, session),
        {dynamic: ['state'], name: 'grant', grant: true, state: 'purest', scope: 'grant'}
      )
      t.deepEqual(
        options,
        {grant: {dynamic: ['state'], name: 'grant', grant: true, state: 'grant', scope: 'grant'}}
      )
    })
    it('state', () => {
      var options = config({grant: {state: true}})
      var session = {provider: 'grant'}
      var result = config.provider(options, session)
      t.ok(/^[a-fA-F0-9]+$/.test(result.state))
      t.deepEqual(options, {grant: {name: 'grant', grant: true, state: true}})
    })
    it('nonce', () => {
      var options = config({grant: {nonce: true}})
      var session = {provider: 'grant'}
      var result = config.provider(options, session)
      t.ok(/^[a-fA-F0-9]+$/.test(result.nonce))
      t.deepEqual(options, {grant: {name: 'grant', grant: true, nonce: true}})
    })
  })

})
