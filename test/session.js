var t = require('assert')
var signature = require('cookie-signature')
var session = require('../lib/session')


describe('session', () => {

  it('throw on missing cookie secret', () => {
    try {
      session({})
    }
    catch (err) {
      t.equal(err.message, 'Grant: cookie secret is required')
    }
  })

  it('cookie store - set, get, remove - no input headers', async () => {
    var config = {secret: 'grant'}
    var request = {headers: {}}
    var store = session(config)(request)

    var input = {provider: 'google'}
    await store.set(input)
    t.deepEqual(await store.get(), input)

    var output = 'eyJwcm92aWRlciI6Imdvb2dsZSJ9.5Zguv22ColWMBAH4A8w7ymszwQ8yXkxcjcHzSB1NoRw'
    t.deepEqual(store.headers, {'set-cookie': [`grant=${output}; Path=/; HttpOnly`]})
    t.deepEqual(
      input,
      JSON.parse(Buffer.from(signature.unsign(output, config.secret), 'base64'))
    )

    await store.remove()
    t.deepEqual(await store.get(), {})
    var output = 'IiI%3D.0IZwUDQpopV3fCMGLJec49pTIr1nf4OjyzB%2FbxsqD%2FE'
    t.deepEqual(store.headers, {'set-cookie': [`grant=${output}; Max-Age=0; Path=/; HttpOnly`]})
    t.equal(
      '',
      JSON.parse(Buffer.from(signature.unsign(decodeURIComponent(output), config.secret), 'base64'))
    )
  })

  it('session store - set, get, remove - no input headers', async () => {
    var store = ((session) => ({
      get: async (sid) => session,
      set: async (sid, value) => session = value,
      remove: async (sid) => session = {}
    }))()
    var config = {secret: 'grant', store}
    var request = {headers: {}}
    var store = session(config)(request)

    var input = {provider: 'google'}
    await store.set(input)
    t.deepEqual(await store.get(), input)

    var output = store.headers['set-cookie'][0].split(';')[0].split('=')[1]
    var sid = signature.unsign(decodeURIComponent(output), config.secret)
    output = `${sid}.${output.split('.')[1]}`
    t.deepEqual(store.headers, {'set-cookie': [`grant=${output}; Path=/; HttpOnly`]})

    await store.remove()
    t.deepEqual(await store.get(), {})
    var output = store.headers['set-cookie'][0].split(';')[0].split('=')[1]
    var sid = signature.unsign(decodeURIComponent(output), config.secret)
    output = `${sid}.${output.split('.')[1]}`
    t.deepEqual(store.headers, {'set-cookie': [`grant=${output}; Max-Age=0; Path=/; HttpOnly`]})
  })

  it('existing set-cookie headers', async () => {
    var config = {secret: 'grant'}
    var request = {headers: {'set-cookie': ['foo=bar; Path=/; HttpOnly']}}
    var store = session(config)(request)

    var input = {provider: 'google'}
    await store.set(input)
    t.deepEqual(await store.get(), input)

    var output = 'eyJwcm92aWRlciI6Imdvb2dsZSJ9.5Zguv22ColWMBAH4A8w7ymszwQ8yXkxcjcHzSB1NoRw'
    t.deepEqual(store.headers, {
      'set-cookie': ['foo=bar; Path=/; HttpOnly', `grant=${output}; Path=/; HttpOnly`]
    })
    t.deepEqual(
      input,
      JSON.parse(Buffer.from(signature.unsign(output, config.secret), 'base64'))
    )
  })

  it('cookie store - get session from cookie header', async () => {
    var input = {provider: 'google'}
    var output = 'eyJwcm92aWRlciI6Imdvb2dsZSJ9.5Zguv22ColWMBAH4A8w7ymszwQ8yXkxcjcHzSB1NoRw'

    var config = {secret: 'grant'}
    var request = {headers: {cookie: `grant=${output}; foo=bar`}}
    var store = session(config)(request)

    t.deepEqual(await store.get(), input)

    t.deepEqual(store.headers, {
      cookie: `grant=${output}; foo=bar`,
      'set-cookie': []
    })
    t.deepEqual(
      input,
      JSON.parse(Buffer.from(signature.unsign(output, config.secret), 'base64'))
    )
  })

  it('session store - get session from cookie header', async () => {
    var store = ((session) => ({
      get: async (sid) => session,
      set: async (sid, value) => session = value,
      remove: async (sid) => session = {}
    }))()

    var input = {provider: 'google'}
    var output = '4b3c6de9d57d653c16615aef3062fc418483a2aa.n5nMvp5FH5ewOwDOnx%2Beqd6m8XlbtVHIX19YyG81HvQ'

    var config = {secret: 'grant', store}
    var request = {headers: {cookie: `grant=${output}; foo=bar`}}
    var store = session(config)(request)

    t.deepEqual(await store.get(), {grant: {}})

    t.deepEqual(
      store.headers, {
      cookie: `grant=${output}; foo=bar`,
      'set-cookie': []
    })
  })

})
