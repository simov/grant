
var t = require('assert')


describe('middleware', () => {

  describe('function handlers', () => {
    var grant = require('../')

    it('express', () => {
      t.ok(typeof grant.express === 'function')
      t.deepEqual(
        grant.express()({defaults: {dynamic: true}}).config,
        {defaults: {prefix: '/connect', dynamic: true}}
      )
    })
    it('koa', () => {
      t.ok(typeof grant.koa === 'function')
      t.deepEqual(
        grant.koa()({defaults: {dynamic: true}}).config,
        {defaults: {prefix: '/connect', dynamic: true}}
      )
    })
    it('hapi', () => {
      t.ok(typeof grant.hapi === 'function')
      t.ok(typeof grant.hapi()({defaults: {dynamic: true}}).register === 'function')
    })
  })

  describe('grant', () => {
    var grant = require('../')
    var config = {defaults: {dynamic: true}}

    it('express', () => {
      var mw = grant({handler: 'express', config})
      t.deepEqual(mw.config, {defaults: {prefix: '/connect', dynamic: true}})
    })
    it('koa', () => {
      var mw = grant({handler: 'koa', config})
      t.deepEqual(mw.config, {defaults: {prefix: '/connect', dynamic: true}})
    })
    it('koa-2', () => {
      var mw = grant({handler: 'koa-2', config})
      t.deepEqual(mw.config, {defaults: {prefix: '/connect', dynamic: true}})
    })
    it('hapi', () => {
      var mw = grant({handler: 'hapi', config})
      t.ok(typeof mw.register === 'function')
    })
  })

  describe('expose config', () => {
    it('express', () => {
      var Grant = require('../').express()
      var grant = Grant()
      t.ok(typeof grant.config === 'object')
    })
    it('koa', () => {
      var Grant = require('../').koa()
      var grant = Grant()
      t.ok(typeof grant.config === 'object')
    })
  })

  describe('constructor', () => {
    it('using new', () => {
      var Grant = require('../').express()
      var grant1 = new Grant({grant1: {}})
      var grant2 = new Grant({grant2: {}})
      t.deepEqual(grant1.config, {
        defaults: {prefix: '/connect'},
        grant1: {prefix: '/connect', grant1: true, name: 'grant1'}
      })
      t.deepEqual(grant2.config, {
        defaults: {prefix: '/connect'},
        grant2: {prefix: '/connect', grant2: true, name: 'grant2'}
      })

      var Grant = require('../').koa()
      var grant1 = new Grant({grant1: {}})
      var grant2 = new Grant({grant2: {}})
      t.deepEqual(grant1.config, {
        defaults: {prefix: '/connect'},
        grant1: {prefix: '/connect', grant1: true, name: 'grant1'}
      })
      t.deepEqual(grant2.config, {
        defaults: {prefix: '/connect'},
        grant2: {prefix: '/connect', grant2: true, name: 'grant2'}
      })
    })
    it('without using new', () => {
      var Grant = require('../').express()
      var grant1 = Grant({grant1: {}})
      var grant2 = Grant({grant2: {}})
      t.deepEqual(grant1.config, {
        defaults: {prefix: '/connect'},
        grant1: {prefix: '/connect', grant1: true, name: 'grant1'}
      })
      t.deepEqual(grant2.config, {
        defaults: {prefix: '/connect'},
        grant2: {prefix: '/connect', grant2: true, name: 'grant2'}
      })

      var Grant = require('../').koa()
      var grant1 = Grant({grant1: {}})
      var grant2 = Grant({grant2: {}})
      t.deepEqual(grant1.config, {
        defaults: {prefix: '/connect'},
        grant1: {prefix: '/connect', grant1: true, name: 'grant1'}
      })
      t.deepEqual(grant2.config, {
        defaults: {prefix: '/connect'},
        grant2: {prefix: '/connect', grant2: true, name: 'grant2'}
      })
    })
  })

  describe('hapi options', () => {
    var {Hapi, hapi} = (() => {
      var load = (prefix) => ({
        Hapi: require(`${prefix}hapi`),
        hapi: parseInt(require(`${prefix}hapi/package.json`).version.split('.')[0])
      })
      try {
        return load('')
      }
      catch (err) {
        return load('@hapi/')
      }
    })()
    var Grant = require('../').hapi()

    if (hapi < 17) {
      it('passed in server.register', (done) => {
        var config = {grant: {}}
        var grant = new Grant()
        var server = new Hapi.Server()
        server.connection({host: 'localhost', port: 5000})
        server.register([{register: grant, options: config}], () => {
          t.deepEqual(
            grant.config,
            {
              defaults: {prefix: '/connect'},
              grant: {
                prefix: '/connect', grant: true, name: 'grant'
              }
            }
          )
          done()
        })
      })
      it('passed in the constructor', (done) => {
        var config = {grant: {}}
        var grant = Grant(config)
        var server = new Hapi.Server()
        server.connection({host: 'localhost', port: 5000})
        server.register([{register: grant}], () => {
          t.deepEqual(
            grant.config,
            {
              defaults: {prefix: '/connect'},
              grant: {
                prefix: '/connect', grant: true, name: 'grant'
              }
            }
          )
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
          t.deepEqual(
            grant.config,
            {
              defaults: {prefix: '/connect'},
              grant: {
                prefix: '/connect', grant: true, name: 'grant'
              }
            }
          )
          done()
        })
      })
      it('passed in the constructor', (done) => {
        var config = {grant: {}}
        var grant = Grant(config)
        var server = new Hapi.Server({host: 'localhost', port: 5000})
        server.register([{plugin: grant}]).then(() => {
          t.deepEqual(
            grant.config,
            {
              defaults: {prefix: '/connect'},
              grant: {
                prefix: '/connect', grant: true, name: 'grant'
              }
            }
          )
          done()
        })
      })
    }
  })
})
