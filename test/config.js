'use strict'

var should = require('should')
var config = require('../lib/config')


describe('config', function () {

  describe('scope', function () {
    it('array with comma', function () {
      var provider = {}
      var options = {scope:['scope1','scope2']}
      config.scope(provider, options)
      provider.scope.should.equal('scope1,scope2')
    })
    it('array with delimiter', function () {
      var provider = {scope_delimiter:' '}
      var options = {scope:['scope1','scope2']}
      config.scope(provider, options)
      provider.scope.should.equal('scope1 scope2')
    })
    it('string', function () {
      var provider = {}
      var options = {scope:'scope1,scope2'}
      config.scope(provider, options)
      provider.scope.should.equal('scope1,scope2')
    })
    it('set linkedin scopes as querystring', function () {
      var provider = {linkedin:true, request_url:'https://requestToken'}
      var options = {scope:['scope1','scope2']}
      config.scope(provider, options)
      provider.request_url.should.equal('https://requestToken?scope=scope1,scope2')
    })
  })

  describe('override', function () {
    it('dcopy', function () {
      var provider = {scope:['scope1'], callback:'/'}
      var options = {scope:['scope1','scope2']}
      var copy = config.override(provider, options)
      should.deepEqual(provider, {scope:['scope1'], callback:'/'})
      should.deepEqual(copy, {scope:['scope1','scope2'], callback:'/'})
    })
  })

  describe('dynamic', function () {
    it('no options to override', function () {
      var provider = {scope:['scope1'], callback:'/'}
      var options = {scope:'', callback:null}
      var dynamic = config.dynamic(provider, options)
      should.deepEqual(provider, {scope:['scope1'], callback:'/'})
      should.deepEqual(dynamic, {scope:'scope1', callback:'/'})
    })
    it('override', function () {
      var provider = {scope:['scope1'], callback:'/'}
      var options = {scope:['scope1','scope2']}
      var dynamic = config.dynamic(provider, options)
      should.deepEqual(provider, {scope:['scope1'], callback:'/'})
      should.deepEqual(dynamic, {scope:'scope1,scope2', callback:'/'})
    })
  })

  describe('state', function () {
    it('string', function () {
      var provider = {state:'123'}
      var state = config.state(provider)
      state.should.equal('123')
    })
    it('number', function () {
      var provider = {state:123}
      var state = config.state(provider)
      state.should.equal('123')
    })
    it('boolean true', function () {
      var provider = {state:true}
      var state = config.state(provider)
      state.should.match(/\d+/)
      state.should.be.type('string')
    })
    it('boolean false', function () {
      var provider = {state:false}
      var state = config.state(provider)
      should.equal(state, undefined)
    })
  })

  describe('init', function () {
    it('custom providers', function () {
      var options = {server:{}, custom:{}}
      var cfg = config.init(options)
      cfg.custom.should.be.instanceOf(Object)
    })

    it('shortcuts', function () {
      var options = {server:{}, facebook:{key:'key',secret:'secret'}}
      var cfg = config.init(options)
      cfg.facebook.facebook.should.equal(true)
      cfg.facebook.name.should.equal('facebook')
    })
    it('credentials', function () {
      var options = {server:{}, facebook:{key:'key',secret:'secret'}}
      var cfg = config.init(options)
      cfg.facebook.key.should.equal('key')
      cfg.facebook.secret.should.equal('secret')
    })

    it('use server options', function () {
      var options = {
        server:{
          protocol:'http', host:'localhost:3000', callback:'/',
          transport:'session', state:true
        }
      }
      var cfg = config.init(options)
      cfg.facebook.protocol.should.equal('http')
      cfg.facebook.host.should.equal('localhost:3000')
      cfg.facebook.callback.should.equal('/')
      cfg.facebook.transport.should.equal('session')
      cfg.facebook.state.should.equal(true)
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
      var cfg = config.init(options)
      cfg.facebook.protocol.should.equal('https')
      cfg.facebook.host.should.equal('dummy.com:3000')
      cfg.facebook.callback.should.equal('/callback')
      cfg.facebook.transport.should.equal('querystring')
      cfg.facebook.state.should.equal('Grant')
    })

    it('override oauth options', function () {
      var options = {
        server:{},
        facebook:{
          authorize_url:'https://custom_authorize_url',
          access_url:'https://custom_access_url'
        }
      }
      var cfg = config.init(options)
      cfg.facebook.authorize_url.should.equal('https://custom_authorize_url')
      cfg.facebook.access_url.should.equal('https://custom_access_url')
    })

    describe('custom', function () {
      it('skip on non string value', function () {
        var options = {server:{}, google:{access_type:{}}}
        var cfg = config.init(options)
        should.equal(cfg.google.access_type, undefined)
      })
      it('skip on reserved key', function () {
        var options = {server:{}, google:{custom:'something'}}
        var cfg = config.init(options)
        should.equal(cfg.google.access_type, undefined)
      })
      it('skip on missing custom_parameters option', function () {
        var options = {server:{}, facebook:{something:'interesting'}}
        var cfg = config.init(options)
        should.equal(cfg.google.access_type, undefined)
      })
      it('skip on not defined custom_parameters', function () {
        var options = {server:{}, google:{something:'interesting'}}
        var cfg = config.init(options)
        should.equal(cfg.google.access_type, undefined)
      })
      it('set custom_parameters value', function () {
        var options = {server:{}, google:{access_type:'offline'}}
        var cfg = config.init(options)
        cfg.google.access_type.should.equal('offline')
      })
    })

    describe('overrides', function () {
      it('skip on reserved key', function () {
        var options = {server:{}, facebook:{
          scope:['scope1'], callback:'/callback', transport:{scope:['scope2']}}
        }
        var cfg = config.init(options)
        should.deepEqual(cfg.facebook.overrides, {})
      })
      it('override provider options', function () {
        var options = {server:{}, facebook:{
          scope:['scope1'], callback:'/callback', custom:{scope:['scope2']}}
        }
        var cfg = config.init(options)
        cfg.facebook.scope.should.equal('scope1')
        cfg.facebook.callback.should.equal('/callback')
        cfg.facebook.overrides.custom.scope.should.equal('scope2')
        cfg.facebook.overrides.custom.callback.should.equal('/callback')
      })
    })
  })

  describe('provider', function () {
    it('default', function () {
      var cfg = {google:{callback:'/'}}
      var session = {provider:'google'}
      var provider = config.provider(cfg, session)
      should.deepEqual(provider, {callback:'/'})
    })
    it('override no overrides', function () {
      var cfg = {google:{callback:'/'}}
      var session = {provider:'google', override:'contacts'}
      var provider = config.provider(cfg, session)
      should.deepEqual(provider, {callback:'/'})
    })
    it('override not matching', function () {
      var cfg = {google:{callback:'/', overrides:{gmail:{callback:'/gmail'}}}}
      var session = {provider:'google', override:'contacts'}
      var provider = config.provider(cfg, session)
      should.deepEqual(provider, {callback:'/', overrides:{gmail:{callback:'/gmail'}}})
    })
    it('override match', function () {
      var cfg = {google:{callback:'/', overrides:{contacts:{callback:'/contacts'}}}}
      var session = {provider:'google', override:'contacts'}
      var provider = config.provider(cfg, session)
      should.deepEqual(provider, {callback:'/contacts'})
    })
    it('dynamic', function () {
      var cfg = {google:{callback:'/'}}
      var session = {dynamic:{callback:'/contacts'}}
      var provider = config.provider(cfg, session)
      should.deepEqual(provider, {callback:'/contacts'})
    })
    it('state dcopy', function () {
      var cfg = {google:{callback:'/', state:true}}
      var session = {provider:'google'}
      var provider = config.provider(cfg, session)
      cfg.google.state.should.equal(true)
      provider.state.should.match(/\d+/)
      provider.state.should.be.type('string')
    })
  })
})
