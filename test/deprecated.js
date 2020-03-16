
var t = require('assert').strict
var grant = require('../')

describe('deprecated', () => {
  it('constructor', () => {
    t.ok(typeof grant.express === 'function')
    t.deepEqual(
      grant.express()({defaults: {dynamic: true}}).config,
      {defaults: {prefix: '/connect', dynamic: true}}
    )
    t.ok(typeof grant.koa === 'function')
    t.deepEqual(
      grant.koa()({defaults: {dynamic: true}}).config,
      {defaults: {prefix: '/connect', dynamic: true}}
    )
    t.ok(typeof grant.hapi === 'function')
    t.ok(typeof grant.hapi()({defaults: {dynamic: true}}).register === 'function')
  })
})
