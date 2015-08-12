'use strict'

var should = require('should')
var config = require('../lib/config')
  , Grant = require('../').express()


describe('config', function () {

  describe('credentials', function () {
    it('key secret', function () {
      var provider = {oauth:2, key:'key1', secret:'secret1'}
        , options = {key:'key2', secret:'secret2'}
      config.credentials(provider, options)
      provider.key.should.equal('key1')
      provider.secret.should.equal('secret1')
    })
    it('consumer_key consumer_secret', function () {
      var provider = {oauth:1, key:'key1', secret:'secret1'}
        , options = {consumer_key:'key2', consumer_secret:'secret2'}
      config.credentials(provider, options)
      provider.key.should.equal('key2')
      provider.secret.should.equal('secret2')
    })
    it('client_id client_secret', function () {
      var provider = {oauth:2, key:'key1', secret:'secret1'}
        , options = {client_id:'key2', client_secret:'secret2'}
      config.credentials(provider, options)
      provider.key.should.equal('key2')
      provider.secret.should.equal('secret2')
    })
  })

  describe('scope', function () {
    it('array with comma', function () {
      var provider = {}
        , options = {scope:['scope1','scope2']}
      config.scope(provider, options)
      provider.scope.should.equal('scope1,scope2')
    })
    it('array with delimiter', function () {
      var provider = {scope_delimiter:' '}
        , options = {scope:['scope1','scope2']}
      config.scope(provider, options)
      provider.scope.should.equal('scope1 scope2')
    })
    it('string', function () {
      var provider = {}
        , options = {scope:'scope1,scope2'}
      config.scope(provider, options)
      provider.scope.should.equal('scope1,scope2')
    })
    it('stringify scope object for `copy`', function () {
      var provider = {copy:true}
        , options = {scope: {profile: {read:true}}}
      config.scope(provider, options)
      provider.scope.should.equal('{"profile":{"read":true}}')
    })
    it('do not stringify already stringified scope for `copy`', function () {
      var provider = {copy:true, scope:'{"profile":{"read":true}}'}
        , options = {}
      config.scope(provider, options)
      provider.scope.should.equal('{"profile":{"read":true}}')
    })
  })

  describe('state', function () {
    it('string', function () {
      var provider = {state:'123'}
        , state = config.state(provider)
      state.should.equal('123')
    })
    it('number', function () {
      var provider = {state:123}
        , state = config.state(provider)
      state.should.equal('123')
    })
    it('boolean true', function () {
      var provider = {state:true}
        , state = config.state(provider)
      state.should.match(/^\w+$/)
      state.should.be.type('string')
    })
    it('boolean false', function () {
      var provider = {state:false}
        , state = config.state(provider)
      should.equal(state, undefined)
    })
  })

  describe('override', function () {
    it('dcopy', function () {
      var provider = {scope:['scope1'], callback:'/'}
        , options = {scope:['scope1','scope2']}
        , copy = config.override(provider, options)
      should.deepEqual(provider, {scope:['scope1'], callback:'/'})
      should.deepEqual(copy, {scope:'scope1,scope2', callback:'/'})
    })
    it('no options to override', function () {
      var provider = {scope:['scope1'], callback:'/'}
        , options = {scope:'', callback:null}
        , dynamic = config.override(provider, options)
      should.deepEqual(provider, {scope:['scope1'], callback:'/'})
      should.deepEqual(dynamic, {scope:'scope1', callback:'/'})
    })
    it('override', function () {
      var provider = {scope:['scope1'], callback:'/'}
        , options = {scope:['scope1','scope2']}
        , dynamic = config.override(provider, options)
      should.deepEqual(provider, {scope:['scope1'], callback:'/'})
      should.deepEqual(dynamic, {scope:'scope1,scope2', callback:'/'})
    })
  })

  describe('initProvider', function () {
    it('shortcuts', function () {
      var options = {server:{}, facebook:{}}
        , provider = config.initProvider('facebook', options)
      provider.facebook.should.equal(true)
      provider.name.should.equal('facebook')
    })
    it('credentials', function () {
      var options = {server:{}, facebook:{key:'key',secret:'secret'}}
        , provider = config.initProvider('facebook', options)
      provider.key.should.equal('key')
      provider.secret.should.equal('secret')
    })

    it('use server options', function () {
      var options = {
        server:{
          protocol:'http', host:'localhost:3000', callback:'/',
          transport:'session', state:true
        },
        facebook:{}
      }
      var provider = config.initProvider('facebook', options)
      provider.protocol.should.equal('http')
      provider.host.should.equal('localhost:3000')
      provider.callback.should.equal('/')
      provider.transport.should.equal('session')
      provider.state.should.equal(true)
    })
    it('override server options', function () {
      var options = {
        server:{
          protocol:'http', host:'localhost:3000', callback:'/',
          transport:'session', state:true
        },
        facebook:{
          protocol:'https', host:'dummy.com:3000', callback:'/callback',
          transport:'querystring', state:'Grant'
        }
      }
      var provider = config.initProvider('facebook', options)
      provider.protocol.should.equal('https')
      provider.host.should.equal('dummy.com:3000')
      provider.callback.should.equal('/callback')
      provider.transport.should.equal('querystring')
      provider.state.should.equal('Grant')
    })

    it('override oauth options', function () {
      var options = {
        server:{},
        facebook:{
          authorize_url:'https://custom_authorize_url',
          access_url:'https://custom_access_url'
        }
      }
      var provider = config.initProvider('facebook', options)
      provider.authorize_url.should.equal('https://custom_authorize_url')
      provider.access_url.should.equal('https://custom_access_url')
      provider.oauth.should.equal(2)
    })

    it('custom provider', function () {
      var options = {server:{}, custom:{
        authorize_url:'https://custom_authorize_url',
        access_url:'https://custom_access_url',
        oauth:2,
        scope_delimiter:'+',
        custom_parameters:['a','b'],
        key:'key',
        secret:'secret',
        scope:['a','b']
      }}
      var provider = config.initProvider('custom', options)
      should.deepEqual(provider, {
        custom:true,
        name:'custom',
        authorize_url:'https://custom_authorize_url',
        access_url:'https://custom_access_url',
        oauth:2,
        scope_delimiter:'+',
        custom_parameters:['a', 'b'],
        key:'key',
        secret:'secret',
        scope:'a+b'
      })
    })

    describe('custom parameters', function () {
      it('skip on missing custom_parameters option', function () {
        var options = {server:{}, custom:{access_type:'offline'}}
          , provider = config.initProvider('custom', options)
        should.equal(provider.access_type, undefined)
      })
      it('skip on non string value', function () {
        var options = {server:{}, custom:{
          access_type:{}, custom_parameters:['access_type']}}
        var provider = config.initProvider('custom', options)
        should.equal(provider.access_type, undefined)
      })
      it('skip on not defined custom_parameters', function () {
        var options = {server:{}, custom:{
          something:'interesting', custom_parameters:['access_type']}}
        var provider = config.initProvider('custom', options)
        should.equal(provider.something, undefined)
      })
      it('set custom_parameters value', function () {
        var options = {server:{}, custom:{
          access_type:'offline', custom_parameters:['access_type']}}
        var provider = config.initProvider('custom', options)
        provider.access_type.should.equal('offline')
      })
    })

    describe('static overrides', function () {
      it('skip on reserved key', function () {
        var options = {server:{}, facebook:{
          scope:['scope1'], callback:'/callback', transport:{scope:['scope2']}}
        }
        var provider = config.initProvider('facebook', options)
        should.equal(provider.overrides, undefined)
      })
      it('create override', function () {
        var options = {server:{}, facebook:{
          scope:['scope1'], callback:'/callback', custom:{scope:['scope2']}}
        }
        var provider = config.initProvider('facebook', options)
        provider.scope.should.equal('scope1')
        provider.callback.should.equal('/callback')
        provider.overrides.custom.scope.should.equal('scope2')
        provider.overrides.custom.callback.should.equal('/callback')
      })
    })
  })

  describe('init', function () {
    it('only the specified providers', function () {
      var options = {server:{}, facebook:{}, custom:{}}
        , cfg = config.init(options)
      should.deepEqual(cfg, {
        server:{},
        facebook:{
          authorize_url:'https://www.facebook.com/dialog/oauth',
          access_url:'https://graph.facebook.com/oauth/access_token',
          oauth:2,
          facebook:true,
          name:'facebook' },
        custom:{custom:true, name:'custom'}
      })
    })
  })

  describe('provider', function () {
    it('default', function () {
      var cfg = {google:{callback:'/'}}
        , session = {provider:'google'}
        , provider = config.provider(cfg, session)
      provider.callback.should.equal('/')
    })
    it('non configured', function () {
      var cfg = {server:{}}
        , session = {provider:'custom'}
        , provider = config.provider(cfg, session)
      should.deepEqual(provider, {custom:true, name:'custom'})
      should.deepEqual(cfg, {server:{}, custom:{custom:true, name:'custom'}})
    })

    describe('overrides', function () {
      it('no overrides', function () {
        var cfg = {google:{callback:'/'}}
          , session = {provider:'google', override:'contacts'}
          , provider = config.provider(cfg, session)
        provider.callback.should.equal('/')
      })
      it('not matching', function () {
        var cfg = {google:{callback:'/',overrides:{gmail:{callback:'/gmail'}}}}
          , session = {provider:'google', override:'contacts'}
          , provider = config.provider(cfg, session)
        provider.callback.should.equal('/')
      })
      it('match', function () {
        var cfg = {google:{callback:'/',
          overrides:{contacts:{callback:'/contacts'}}}}
          , session = {provider:'google', override:'contacts'}
          , provider = config.provider(cfg, session)
        provider.callback.should.equal('/contacts')
      })
    })

    it('dynamic', function () {
      var cfg = {google:{callback:'/'}}
        , session = {provider:'google', dynamic:{callback:'/contacts'}}
        , provider = config.provider(cfg, session)
      provider.callback.should.equal('/contacts')
    })
    it('state dcopy', function () {
      var cfg = {google:{callback:'/', state:true}}
        , session = {provider:'google'}
        , provider = config.provider(cfg, session)
      cfg.google.state.should.equal(true)
      provider.state.should.match(/\d+/)
      provider.state.should.be.type('string')
    })
  })

  describe('expose', function () {
    it('config and _config', function () {
      var grant = new Grant()
      grant.config.should.be.type('object')
      grant._config.oauth.should.be.type('object')
    })
  })
})
