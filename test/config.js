
var t = require('assert')
var config = require('../lib/config')
var Grant = require('../').express()


describe('config', () => {

  describe('merge', () => {
    it('name', () => {
      var provider = {}, options = {}, server = {}, name = 'grant'
      var result = config.merge({provider, options, server, name})
      t.deepEqual(result, {
        grant: true, name: 'grant'
      })
    })

    describe('oauth app credentials', () => {
      it('consumer_key, consumer_secret', () => {
        var provider = {consumer_key: 'key', consumer_secret: 'secret', oauth: 1}
        var result = config.merge({provider})
        t.deepEqual(result, {
          consumer_key: 'key', consumer_secret: 'secret', oauth: 1,
          key: 'key', secret: 'secret'
        })
      })
      it('client_id, client_secret', () => {
        var provider = {client_id: 'key', client_secret: 'secret', oauth: 2}
        var result = config.merge({provider})
        t.deepEqual(result, {
          client_id: 'key', client_secret: 'secret', oauth: 2,
          key: 'key', secret: 'secret'
        })
      })
    })

    describe('scope', () => {
      it('array with comma', () => {
        var provider = {scope: ['scope1', 'scope2']}
        var result = config.merge({provider})
        t.deepEqual(result, {
          scope: 'scope1,scope2'
        })
      })
      it('array with delimiter', () => {
        var provider = {scope: ['scope1', 'scope2'], scope_delimiter: ' '}
        var result = config.merge({provider})
        t.deepEqual(result, {
          scope: 'scope1 scope2', scope_delimiter: ' '
        })
      })
      it('stringify scope object', () => {
        var provider = {scope: {profile: {read: true}}}
        var result = config.merge({provider})
        t.deepEqual(result, {
          scope: '{"profile":{"read":true}}'
        })
      })
      it('string', () => {
        var provider = {scope: 'scope1,scope2'}
        var result = config.merge({provider})
        t.deepEqual(result, {
          scope: 'scope1,scope2'
        })
      })
    })

    describe('redirect_uri', () => {
      it('protocol and host', () => {
        var defaults = {protocol: 'http', host: 'localhost:5000'}
        var provider = {name: 'grant'}
        var result = config.merge({provider, defaults})
        t.equal(
          result.redirect_uri,
          'http://localhost:5000/connect/grant/callback'
        )
      })
      it('path prefix', () => {
        var defaults = {protocol: 'http', host: 'localhost:5000', path: '/path/prefix'}
        var provider = {name: 'grant'}
        var result = config.merge({provider, defaults})
        t.equal(
          result.redirect_uri,
          'http://localhost:5000/path/prefix/connect/grant/callback'
        )
      })
      it('redirect_uri overrides protocol and host', () => {
        var defaults = {protocol: 'http', host: 'localhost:5000', callback: '/'}
        var provider = {name: 'grant', redirect_uri: 'http://localhost:5000'}
        var result = config.merge({provider, defaults})
        t.equal(
          result.redirect_uri,
          'http://localhost:5000'
        )
      })
    })

    describe('custom_params', () => {
      it('empty keys in options.custom_params are excluded', () => {
        var provider = {custom_params: {name: 'grant'}}
        var options = {custom_params: {name: ''}}
        var result = config.merge({provider, options, name: 'grant'})
        t.deepEqual(result, {
          custom_params: {name: 'grant'}, grant: true, name: 'grant'
        })
      })
      it('options.custom_params override provider.custom_params', () => {
        var provider = {custom_params: {name: 'grant'}}
        var options = {custom_params: {name: 'purest'}}
        var result = config.merge({provider, options, name: 'grant'})
        t.deepEqual(result, {
          custom_params: {name: 'purest'}, grant: true, name: 'grant'
        })
      })
    })

    describe('custom_parameters', () => {
      it('skip params not defined in custom_parameters', () => {
        var provider = {custom_parameters: ['access_type']}
        var options = {something: 'interesting'}
        var result = config.merge({provider, options})
        t.deepEqual(result, {
          custom_parameters: ['access_type']
        })
      })
      it('skip params that are reserved keys', () => {
        var provider = {custom_parameters: ['client_id']}
        var options = {client_id: 'key'}
        var result = config.merge({provider, options})
        t.deepEqual(result, {
          custom_parameters: ['client_id'],
          client_id: 'key'
        })
      })

      it('set custom_parameters value', () => {
        var provider = {custom_parameters: ['expiration']}
        var options = {expiration: 'never'}
        var result = config.merge({provider, options})
        t.deepEqual(result, {
          custom_parameters: ['expiration'],
          custom_params: {expiration: 'never'}
        })
      })
      it('set object as custom_parameters value', () => {
        var provider = {custom_parameters: ['meta']}
        var options = {meta: {a: 'b'}}
        var result = config.merge({provider, options})
        t.deepEqual(result, {
          custom_parameters: ['meta'],
          custom_params: {meta: {a: 'b'}}
        })
      })

      it('custom_parameters extends provider.custom_params', () => {
        var provider = {custom_parameters: ['expiration'], custom_params: {name: 'grant'}}
        var options = {expiration: 'never'}
        var result = config.merge({provider, options})
        t.deepEqual(result, {
          custom_parameters: ['expiration'],
          custom_params: {name: 'grant', expiration: 'never'},
        })
      })
    })

    describe('overrides', () => {
      it('set overrides', () => {
        var provider = {scope: ['scope'], callback: '/callback'}
        var options = {sub1: {scope: ['scope1']}, sub2: {scope: ['scope2']}}
        var defaults = {state: true}
        var result = config.merge({provider, options, defaults})
        t.deepEqual(result, {
          scope: 'scope', callback: '/callback', state: true,
          overrides: {
            sub1: {
              scope: 'scope1', callback: '/callback', state: true
            },
            sub2: {
              scope: 'scope2', callback: '/callback', state: true
            }
          }
        })
      })
      it('deep - not accessible through /connect/:provider/:override?', () => {
        var provider = {scope: ['scope'], callback: '/callback'}
        var options = {sub1: {scope: ['scope1'], sub2: {scope: ['scope2']}}}
        var result = config.merge({provider, options})
        t.deepEqual(result, {
          scope: 'scope', callback: '/callback',
          overrides: {
            sub1: {
              scope: 'scope1', callback: '/callback',
              overrides: {
                sub2: {
                  scope: 'scope2', callback: '/callback'
                }
              }
            }
          }
        })
      })
    })
  })

  describe('init', () => {
    it('initialize only the specified providers', () => {
      var options = {
        server: {protocol: 'http', host: 'localhost:3000'},
        facebook: {},
        custom: {}
      }
      var result = config.init(options)
      t.deepEqual(result, {
        defaults: {protocol: 'http', host: 'localhost:3000'},
        facebook: {
          authorize_url: 'https://www.facebook.com/dialog/oauth',
          access_url: 'https://graph.facebook.com/oauth/access_token',
          oauth: 2, facebook: true, name: 'facebook',
          protocol: 'http', host: 'localhost:3000',
          redirect_uri: 'http://localhost:3000/connect/facebook/callback'
        },
        custom: {
          custom: true, name: 'custom',
          protocol: 'http', host: 'localhost:3000',
          redirect_uri: 'http://localhost:3000/connect/custom/callback'
        }
      })
    })
    it('initialize without server key', () => {
      var options = {
        facebook: {protocol: 'http', host: 'localhost:3000'},
        custom: {protocol: 'http', host: 'localhost:3000'}
      }
      var result = config.init(options)
      t.deepEqual(result, {
        facebook: {
          authorize_url: 'https://www.facebook.com/dialog/oauth',
          access_url: 'https://graph.facebook.com/oauth/access_token',
          oauth: 2, facebook: true, name: 'facebook',
          protocol: 'http', host: 'localhost:3000',
          redirect_uri: 'http://localhost:3000/connect/facebook/callback'
        },
        custom: {
          custom: true, name: 'custom',
          protocol: 'http', host: 'localhost:3000',
          redirect_uri: 'http://localhost:3000/connect/custom/callback'
        }
      })
    })
  })

  describe('state/nonce', () => {
    it('string', () => {
      var provider = {state: '123', nonce: '456'}
      t.equal(config.state(provider), '123')
      t.equal(config.state(provider, 'nonce'), '456')
    })
    it('number', () => {
      var provider = {state: 123, nonce: 456}
      t.equal(config.state(provider), '123')
      t.equal(config.state(provider, 'nonce'), '456')
    })
    it('boolean true', () => {
      var provider = {state: true, nonce: true}
      var state = config.state(provider)
      t.ok(typeof state === 'string')
      t.ok(/^\w+$/.test(state))
      var nonce = config.state(provider, 'nonce')
      t.ok(typeof nonce === 'string')
      t.ok(/^\w+$/.test(nonce))
      t.notEqual(state, nonce)
    })
    it('boolean false', () => {
      var provider = {state: false, nonce: false}
      t.equal(config.state(provider), undefined)
      t.equal(config.state(provider, 'nonce'), undefined)
    })
  })

  describe('provider', () => {
    it('pre configured', () => {
      var options = {grant: {name: 'grant'}}
      var session = {provider: 'grant'}
      var result = config.provider(options, session)
      t.deepEqual(result, {name: 'grant'})
      t.deepEqual(options, {grant: {name: 'grant'}})
    })
    it('non configured, not allowed dynamic', () => {
      var options = {}
      var session = {provider: 'grant', dynamic: {scope: 'scope1'}}
      var result = config.provider(options, session)
      t.deepEqual(result, {})
      t.deepEqual(options, {})
    })
    it('non configured, existing oauth provider', () => {
      var options = {defaults: {dynamic: true}}
      var session = {provider: 'facebook', dynamic: {scope: 'scope1'}}
      var result = config.provider(options, session)
      t.deepEqual(result, {
        authorize_url: 'https://www.facebook.com/dialog/oauth',
        access_url: 'https://graph.facebook.com/oauth/access_token',
        oauth: 2, facebook: true, name: 'facebook', dynamic: true,
        scope: 'scope1'
      })
      t.deepEqual(options, {defaults: {dynamic: true}})
    })
    it('non configured, non existing oauth provider', () => {
      var options = {defaults: {dynamic: true}}
      var session = {provider: 'grant', dynamic: {scope: 'scope1'}}
      var result = config.provider(options, session)
      t.deepEqual(result, {dynamic: true, scope: 'scope1'})
      t.deepEqual(options, {defaults: {dynamic: true}})
    })

    describe('overrides', () => {
      it('no existing overrides - defaults to provider', () => {
        var options = {grant: {callback: '/'}}
        var session = {provider: 'grant', override: 'purest'}
        var result = config.provider(options, session)
        t.deepEqual(result, {callback: '/'})
      })
      it('non existing override - defaults to provider', () => {
        var options = {grant: {
          callback: '/', overrides: {oauth: {callback: '/callback'}}
        }}
        var session = {provider: 'grant', override: 'purest'}
        var result = config.provider(options, session)
        t.deepEqual(result, {
          callback: '/', overrides: {oauth: {callback: '/callback'}}
        })
      })
      it('pick override', () => {
        var options = {grant: {
          callback: '/', overrides: {purest: {callback: '/callback'}}
        }}
        var session = {provider: 'grant', override: 'purest'}
        var result = config.provider(options, session)
        t.deepEqual(result, {callback: '/callback'})
      })
    })

    describe('dynamic', () => {
      it('override provider key', () => {
        var options = {defaults: {dynamic: true}, grant: {callback: '/'}}
        var session = {provider: 'grant', dynamic: {callback: '/callback'}}
        var result = config.provider(options, session)
        t.deepEqual(result, {callback: '/callback', dynamic: true})
      })
      it('override custom_parameters string value', () => {
        var options = {defaults: {dynamic: true}, grant: {custom_parameters: ['expiration']}}
        var session = {
          provider: 'grant',
          dynamic: {expiration: 'never', custom_params: {name: 'grant'}}
        }
        var result = config.provider(options, session)
        t.deepEqual(result, {
          custom_parameters: ['expiration'],
          custom_params: {name: 'grant', expiration: 'never'},
          dynamic: true
        })
      })
      it('override custom_parameters object value', () => {
        var options = {defaults: {dynamic: true}, grant: {custom_parameters: ['meta']}}
        var session = {
          provider: 'grant', dynamic: {meta: {a: 'b'}}
        }
        var result = config.provider(options, session)
        t.deepEqual(result, {
          custom_parameters: ['meta'],
          custom_params: {meta: {a: 'b'}},
          dynamic: true
        })
      })
      it('override static override', () => {
        var options = {defaults: {dynamic: true}, grant: {
          callback: '/', overrides: {purest: {callback: '/callback'}}
        }}
        var session = {provider: 'grant', override: 'purest', dynamic: {state: 'purest'}}
        var result = config.provider(options, session)
        t.deepEqual(result, {callback: '/callback', state: 'purest', dynamic: true})
      })
      it('dynamic: []', () => {
        var options = {grant: {key: 'key1', scope: 'scope1', dynamic: ['scope']}}
        var session = {
          provider: 'grant',
          dynamic: {key: 'key2', scope: 'scope2'}
        }
        var result = config.provider(options, session)
        t.deepEqual(result, {
          key: 'key1',
          scope: 'scope2',
          dynamic: ['scope']
        })
      })
    })

    describe('state/nonce', () => {
      it('state dcopy', () => {
        var options = {grant: {state: true}}
        var session = {provider: 'grant'}
        var result = config.provider(options, session)
        t.ok(typeof result.state === 'string')
        t.ok(/\d+/.test(result.state))
        t.deepEqual(options, {grant: {state: true}})
      })
      it('nonce dcopy', () => {
        var options = {grant: {nonce: true}}
        var session = {provider: 'grant'}
        var result = config.provider(options, session)
        t.ok(typeof result.nonce === 'string')
        t.ok(/\d+/.test(result.nonce))
        t.deepEqual(options, {grant: {nonce: true}})
      })
    })
  })

  describe('expose', () => {
    it('config', () => {
      var grant = new Grant()
      t.ok(typeof grant.config === 'object')
    })
  })

  describe('constructor', () => {
    it('using new', () => {
      var grant1 = new Grant({grant1: {}})
      var grant2 = new Grant({grant2: {}})
      t.deepEqual(grant1.config, {grant1: {grant1: true, name: 'grant1'}})
      t.deepEqual(grant2.config, {grant2: {grant2: true, name: 'grant2'}})
    })
    it('without using new', () => {
      var grant1 = Grant({grant1: {}})
      var grant2 = Grant({grant2: {}})
      t.deepEqual(grant1.config, {grant1: {grant1: true, name: 'grant1'}})
      t.deepEqual(grant2.config, {grant2: {grant2: true, name: 'grant2'}})
    })
  })

  describe('hapi options', () => {
    var Hapi = require('hapi')
    var Grant = require('../').hapi()
    var hapi = parseInt(require('hapi/package.json').version.split('.')[0])

    if (hapi < 17) {
      it('passed in server.register', (done) => {
        var config = {grant: {}}
        var grant = new Grant()
        var server = new Hapi.Server()
        server.connection({host: 'localhost', port: 5000})
        server.register([{register: grant, options: config}], () => {
          t.deepEqual(grant.config, {grant: {grant: true, name: 'grant'}})
          done()
        })
      })
      it('passed in the constructor', (done) => {
        var config = {grant: {}}
        var grant = new Grant(config)
        var server = new Hapi.Server()
        server.connection({host: 'localhost', port: 5000})
        server.register([{register: grant}], () => {
          t.deepEqual(grant.config, {grant: {grant: true, name: 'grant'}})
          done()
        })
      })
    }
    else {
      it('passed in server.register', (done) => {
        var config = {grant: {}}
        var grant = new Grant()
        var server = new Hapi.Server({host: 'localhost', port: 5000})
        server.register([{plugin: grant, options: config}]).then(() => {
          t.deepEqual(grant.config, {grant: {grant: true, name: 'grant'}})
          done()
        })
      })
      it('passed in the constructor', (done) => {
        var config = {grant: {}}
        var grant = new Grant(config)
        var server = new Hapi.Server({host: 'localhost', port: 5000})
        server.register([{plugin: grant}]).then(() => {
          t.deepEqual(grant.config, {grant: {grant: true, name: 'grant'}})
          done()
        })
      })
    }
  })
})
