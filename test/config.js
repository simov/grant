'use strict'

var t = require('assert')
var config = require('../lib/config')
var Grant = require('../').express()


describe('config', function () {

  describe('initProvider', function () {
    it('shortcuts', function () {
      var provider = {}, options = {}, server = {}, name = 'grant'
      var result = config.initProvider(provider, options, server, name)
      t.deepEqual(result, {
        grant: true, name: 'grant'
      })
    })

    it('consumer_key and consumer_secret', function () {
      var provider = {consumer_key: 'key', consumer_secret: 'secret', oauth: 1}
      var options = {}, server = {}, name = 'grant'
      var result = config.initProvider(provider, options, server, name)
      t.deepEqual(result, {
        consumer_key: 'key', consumer_secret: 'secret', oauth: 1,
        grant: true, name: 'grant', key: 'key', secret: 'secret'
      })
    })
    it('client_id and client_secret', function () {
      var provider = {client_id: 'key', client_secret: 'secret', oauth: 2}
      var options = {}, server = {}, name = 'grant'
      var result = config.initProvider(provider, options, server, name)
      t.deepEqual(result, {
        client_id: 'key', client_secret: 'secret', oauth: 2,
        grant: true, name: 'grant', key: 'key', secret: 'secret'
      })
    })

    describe('scope', function () {
      it('array with comma', function () {
        var provider = {scope: ['scope1', 'scope2']}
        var options = {}, server = {}, name = 'grant'
        var result = config.initProvider(provider, options, server, name)
        t.deepEqual(result, {
          scope: 'scope1,scope2', grant: true, name: 'grant'
        })
      })
      it('array with delimiter', function () {
        var provider = {scope: ['scope1', 'scope2'], scope_delimiter: ' '}
        var options = {}, server = {}, name = 'grant'
        var result = config.initProvider(provider, options, server, name)
        t.deepEqual(result, {
          scope: 'scope1 scope2', scope_delimiter: ' ', grant: true, name: 'grant'
        })
      })
      it('stringify scope object', function () {
        var provider = {scope: {profile: {read: true}}}
        var options = {}, server = {}, name = 'grant'
        var result = config.initProvider(provider, options, server, name)
        t.deepEqual(result, {
          scope: '{"profile":{"read":true}}', grant: true, name: 'grant'
        })
      })
      it('string', function () {
        var provider = {scope: 'scope1,scope2'}
        var options = {}, server = {}, name = 'grant'
        var result = config.initProvider(provider, options, server, name)
        t.deepEqual(result, {
          scope: 'scope1,scope2', grant: true, name: 'grant'
        })
      })
    })

    describe('custom_params', function () {
      it('empty keys in options.custom_params are excluded', function () {
        var provider = {custom_params: {name: 'grant'}}
        var options = {custom_params: {name: ''}}, server = {}, name = 'grant'
        var result = config.initProvider(provider, options, server, name)
        t.deepEqual(result, {
          custom_params: {name: 'grant'}, grant: true, name: 'grant'
        })
      })
      it('options.custom_params override provider.custom_params', function () {
        var provider = {custom_params: {name: 'grant'}}
        var options = {custom_params: {name: 'purest'}}, server = {}, name = 'grant'
        var result = config.initProvider(provider, options, server, name)
        t.deepEqual(result, {
          custom_params: {name: 'purest'}, grant: true, name: 'grant'
        })
      })
    })

    describe('custom_parameters', function () {
      it('skip params not defined in custom_parameters', function () {
        var provider = {custom_parameters: ['access_type']}
        var options = {something: 'interesting'}, server = {}, name = 'grant'
        var result = config.initProvider(provider, options, server, name)
        t.deepEqual(result, {
          custom_parameters: ['access_type'], grant: true, name: 'grant'
        })
      })
      it('skip params that are reserved keys', function () {
        var provider = {custom_parameters: ['name']}
        var options = {name: 'purest'}, server = {}, name = 'grant'
        var result = config.initProvider(provider, options, server, name)
        t.deepEqual(result, {
          custom_parameters: ['name'], grant: true, name: 'grant'
        })
      })

      it('set custom_parameters value', function () {
        var provider = {custom_parameters: ['expiration']}
        var options = {expiration: 'never'}, server = {}, name = 'grant'
        var result = config.initProvider(provider, options, server, name)
        t.deepEqual(result, {
          custom_parameters: ['expiration'], custom_params: {expiration: 'never'},
          grant: true, name: 'grant'
        })
      })
      it('set object as custom_parameters value', function () {
        var provider = {custom_parameters: ['meta']}
        var options = {meta: {a: 'b'}}, server = {}, name = 'grant'
        var result = config.initProvider(provider, options, server, name)
        t.deepEqual(result, {
          custom_parameters: ['meta'], custom_params: {meta: {a: 'b'}},
          grant: true, name: 'grant'
        })
      })

      it('custom_parameters extends provider.custom_params', function () {
        var provider = {custom_parameters: ['expiration'], custom_params: {name: 'grant'}}
        var options = {expiration: 'never'}, server = {}, name = 'grant'
        var result = config.initProvider(provider, options, server, name)
        t.deepEqual(result, {
          custom_parameters: ['expiration'],
          custom_params: {name: 'grant', expiration: 'never'},
          grant: true, name: 'grant'
        })
      })
    })

    describe('overrides', function () {
      it('set overrides', function () {
        var provider = {scope: ['scope'], callback: '/callback'}
        var options = {sub1: {scope: ['scope1']}, sub2: {scope: ['scope2']}}
        var server = {}, name = 'grant'
        var result = config.initProvider(provider, options, server, name)
        t.deepEqual(result, {
          scope: 'scope', callback: '/callback', grant: true, name: 'grant',
          overrides: {sub1: {
            scope: 'scope1', callback: '/callback', grant: true, name: 'grant'
          }, sub2: {
            scope: 'scope2', callback: '/callback', grant: true, name: 'grant'
          }}
        })
      })
    })
  })

  describe('init', function () {
    it('initialize only the specified providers', function () {
      var options = {
        server: {protocol: 'http', host: 'localhost:3000'},
        facebook: {},
        custom: {}
      }
      var result = config.init(options)
      t.deepEqual(result, {
        server: {protocol: 'http', host: 'localhost:3000'},
        facebook: {
          authorize_url: 'https://www.facebook.com/dialog/oauth',
          access_url: 'https://graph.facebook.com/oauth/access_token',
          oauth: 2, facebook: true, name: 'facebook',
          protocol: 'http', host: 'localhost:3000'
        },
        custom: {
          custom: true, name: 'custom',
          protocol: 'http', host: 'localhost:3000'
        }
      })
    })
    it('initialize without server key', function () {
      var options = {
        facebook: {protocol: 'http', host: 'localhost:3000'},
        custom: {protocol: 'http', host: 'localhost:3000'}
      }
      var result = config.init(options)
      t.deepEqual(result, {
        server: {},
        facebook: {
          authorize_url: 'https://www.facebook.com/dialog/oauth',
          access_url: 'https://graph.facebook.com/oauth/access_token',
          oauth: 2, facebook: true, name: 'facebook',
          protocol: 'http', host: 'localhost:3000'
        },
        custom: {
          custom: true, name: 'custom',
          protocol: 'http', host: 'localhost:3000'
        }
      })
    })
  })

  describe('state', function () {
    it('string', function () {
      var provider = {state: '123'}
      var result = config.state(provider)
      t.equal(result, '123')
    })
    it('number', function () {
      var provider = {state: 123}
      var result = config.state(provider)
      t.equal(result, '123')
    })
    it('boolean true', function () {
      var provider = {state: true}
      var result = config.state(provider)
      t.ok(typeof result === 'string')
      t.ok(/^\w+$/.test(result))
    })
    it('boolean false', function () {
      var provider = {state: false}
      var result = config.state(provider)
      t.equal(result, undefined)
    })
  })

  describe('provider', function () {
    it('pre configured', function () {
      var options = {grant: {name: 'grant'}}
      var session = {provider: 'grant'}
      var result = config.provider(options, session)
      t.deepEqual(result, {name: 'grant'})
      t.deepEqual(options, {grant: {name: 'grant'}})
    })
    it('non configured, existing oauth provider', function () {
      var options = {}
      var session = {provider: 'facebook'}
      var result = config.provider(options, session)
      t.deepEqual(result, {
        authorize_url: 'https://www.facebook.com/dialog/oauth',
        access_url: 'https://graph.facebook.com/oauth/access_token',
        oauth: 2, facebook: true, name: 'facebook'
      })
      t.deepEqual(options, {facebook: {
        authorize_url: 'https://www.facebook.com/dialog/oauth',
        access_url: 'https://graph.facebook.com/oauth/access_token',
        oauth: 2, facebook: true, name: 'facebook'
      }})
    })
    it('non configured, non existing oauth provider', function () {
      var options = {}
      var session = {provider: 'grant'}
      var result = config.provider(options, session)
      t.deepEqual(result, {})
      t.deepEqual(options, {})
    })

    describe('overrides', function () {
      it('no existing overrides - defaults to provider', function () {
        var options = {grant: {callback: '/'}}
        var session = {provider: 'grant', override: 'purest'}
        var result = config.provider(options, session)
        t.deepEqual(result, {callback: '/'})
      })
      it('non existing override - defaults to provider', function () {
        var options = {grant: {
          callback: '/', overrides: {oauth: {callback: '/callback'}}
        }}
        var session = {provider: 'grant', override: 'purest'}
        var result = config.provider(options, session)
        t.deepEqual(result, {
          callback: '/', overrides: {oauth: {callback: '/callback'}}
        })
      })
      it('pick override', function () {
        var options = {grant: {
          callback: '/', overrides: {purest: {callback: '/callback'}}
        }}
        var session = {provider: 'grant', override: 'purest'}
        var result = config.provider(options, session)
        t.deepEqual(result, {callback: '/callback'})
      })
    })

    describe('dynamic', function () {
      it('override provider key', function () {
        var options = {grant: {callback: '/'}}
        var session = {provider: 'grant', dynamic: {callback: '/callback'}}
        var result = config.provider(options, session)
        t.deepEqual(result, {callback: '/callback'})
      })
      it('override custom_parameters string value', function () {
        var options = {grant: {custom_parameters: ['expiration']}}
        var session = {
          provider: 'grant',
          dynamic: {expiration: 'never', custom_params: {name: 'grant'}}
        }
        var result = config.provider(options, session)
        t.deepEqual(result, {
          custom_parameters: ['expiration'],
          custom_params: {name: 'grant', expiration: 'never'}
        })
      })
      it('override custom_parameters object value', function () {
        var options = {grant: {custom_parameters: ['meta']}}
        var session = {
          provider: 'grant', dynamic: {meta: {a: 'b'}}
        }
        var result = config.provider(options, session)
        t.deepEqual(result, {
          custom_parameters: ['meta'], custom_params: {meta: {a: 'b'}}
        })
      })
    })

    describe('state', function () {
      it('state dcopy', function () {
        var options = {grant: {state: true}}
        var session = {provider: 'grant'}
        var result = config.provider(options, session)
        t.ok(typeof result.state === 'string')
        t.ok(/\d+/.test(result.state))
        t.deepEqual(options, {grant: {state: true}})
      })
    })
  })

  describe('expose', function () {
    it('config and _config', function () {
      var grant = new Grant()
      t.ok(typeof grant.config === 'object')
      t.ok(typeof grant._config === 'object')
    })
  })

  describe('constructor', () => {
    it('using new', () => {
      var grant1 = new Grant({grant1: {}})
      var grant2 = new Grant({grant2: {}})
      t.deepEqual(grant1.config,
        {grant1: {grant1: true, name: 'grant1'}, server: {}})
      t.deepEqual(grant2.config,
        {grant2: {grant2: true, name: 'grant2'}, server: {}})
    })
    it('without using new', () => {
      var grant1 = Grant({grant1: {}})
      var grant2 = Grant({grant2: {}})
      t.deepEqual(grant1.config,
        {grant1: {grant1: true, name: 'grant1'}, server: {}})
      t.deepEqual(grant2.config,
        {grant2: {grant2: true, name: 'grant2'}, server: {}})
    })
  })

  describe('hapi options', () => {
    it('passed in server.register', (done) => {
      var Hapi = require('hapi')
      var Grant = require('../').hapi()
      var config = {grant: {}}
      var grant = new Grant()
      var server = new Hapi.Server()
      server.connection({host: 'localhost', port: 5000})
      server.register([{register: grant, options: config}], function () {
        t.deepEqual(grant.config,
          {grant: {grant: true, name: 'grant'}, server: {}})
        done()
      })
    })
    it('passed in the constructor', (done) => {
      var Hapi = require('hapi')
      var Grant = require('../').hapi()
      var config = {grant: {}}
      var grant = new Grant(config)
      var server = new Hapi.Server()
      server.connection({host: 'localhost', port: 5000})
      server.register([{register: grant}], function () {
        t.deepEqual(grant.config,
          {grant: {grant: true, name: 'grant'}, server: {}})
        done()
      })
    })
  })
})
