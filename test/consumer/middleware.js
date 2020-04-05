
var t = require('assert')

var request = require('request-compose').extend({
  Request: {cookie: require('request-cookie').Request},
  Response: {cookie: require('request-cookie').Response},
}).client

var Provider = require('../consumer/util/provider'), provider
var Client = require('../consumer/util/client'), client


describe('middleware', () => {
  var config

  before(async () => {
    provider = await Provider({flow: 'oauth2'})
    config = {
      defaults: {
        origin: 'http://localhost:5001', callback: '/',
      },
      oauth2: {
        authorize_url: provider.url('/oauth2/authorize_url'),
        access_url: provider.url('/oauth2/access_url'),
        oauth: 2,
        dynamic: true,
      }
    }
  })

  after(async () => {
    await provider.close()
  })

  describe('handlers', () => {
    ;['express', 'koa', 'hapi'].forEach((handler) => {
      describe(handler, () => {
        before(async () => {
          client = await Client({test: 'handlers', handler, config})
        })

        after(async () => {
          await client.close()
        })

        it('success', async () => {
          var {body: {response}} = await request({
            url: client.url('/connect/oauth2'),
            cookie: {},
          })
          t.deepEqual(response, {
            access_token: 'token',
            refresh_token: 'refresh',
            raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
          })
        })
      })
    })
  })

  describe('missing session middleware', () => {
    ;['express', 'koa', 'hapi'].forEach((handler) => {
      describe(handler, () => {
        before(async () => {
          client = await Client({test: 'missing-session', handler, config})
        })

        after(async () => {
          await client.close()
        })

        it('success', async () => {
          handler === 'hapi' && client.server.events.on('request', (event, tags) => {
            t.equal(tags.error.message, 'Grant: register session plugin first')
          })
          try {
            var {body} = await request({
              url: client.url('/connect/oauth2'),
              cookie: {},
            })
            t.equal(body, 'Grant: mount session middleware first')
          }
          catch (err) {
            // hapi
          }
        })
      })
    })
  })

  describe('missing body-parser middleware', () => {
    ;['express', 'koa'].forEach((handler) => {
      describe(handler, () => {
        before(async () => {
          client = await Client({test: 'missing-parser', handler, config})
        })

        after(async () => {
          await client.close()
        })

        it('success', async () => {
          var {body} = await request({
            method: 'POST',
            url: client.url('/connect/oauth2'),
            cookie: {},
          })
          t.equal(body, 'Grant: mount body parser middleware first')
        })
      })
    })
  })

  describe('path prefix', () => {
    ;['express', 'koa', 'hapi'].forEach((handler) => {
      describe(handler, () => {
        before(async () => {
          client = await Client({test: 'path-prefix', handler, config: {
            defaults: {...config.defaults, path: '/prefix'},
            oauth2: config.oauth2
          }})
        })

        after(async () => {
          await client.close()
        })

        it('success', async () => {
          var {body: {response}} = await request({
            url: client.url('/prefix/connect/oauth2'),
            cookie: {},
          })
          t.deepEqual(response, {
            access_token: 'token',
            refresh_token: 'refresh',
            raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
          })
        })
      })
    })
  })

  describe('dynamic state', () => {
    ;['express', 'koa', 'hapi'].forEach((handler) => {
      describe(handler, () => {
        before(async () => {
          client = await Client({test: 'dynamic-state', handler, config})
        })

        after(async () => {
          await client.close()
        })

        afterEach(() => {
          provider.oauth2.authorize = () => {}
          provider.oauth2.access = () => {}
        })

        it('success', async () => {
          provider.oauth2.authorize = ({query}) => {
            t.deepEqual(query, {
              client_id: 'very',
              response_type: 'code',
              redirect_uri: 'http://localhost:5001/connect/oauth2/callback'
            })
          }
          provider.oauth2.access = ({form}) => {
            t.deepEqual(form, {
              grant_type: 'authorization_code',
              code: 'code',
              client_id: 'very',
              client_secret: 'secret',
              redirect_uri: 'http://localhost:5001/connect/oauth2/callback'
            })
          }
          var {body: {response, session}} = await request({
            url: client.url('/connect/oauth2'),
            cookie: {},
          })
          t.deepEqual(response, {
            access_token: 'token',
            refresh_token: 'refresh',
            raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
          })
          t.deepEqual(session, {provider: 'oauth2'})
        })
      })
    })
  })

  describe('transport querystring session', () => {
    ;['express', 'koa', 'hapi'].forEach((handler) => {
      ;['', 'querystring', 'session'].forEach((transport) => {
        describe(`${handler} - transport ${transport}`, () => {
          before(async () => {
            client = await Client({test: 'handlers', handler, config})
          })

          after(async () => {
            await client.close()
          })

          it('success', async () => {
            var {body: {response, session, state}} = await request({
              url: client.url('/connect/oauth2'),
              qs: {transport},
              cookie: {},
            })
            t.deepEqual(response, {
              access_token: 'token',
              refresh_token: 'refresh',
              raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
            })
            if (/^(|querystring)$/.test(transport)) {
              t.deepEqual(session, {provider: 'oauth2', dynamic: {transport}})
            }
            else if (/session/.test(transport)) {
              t.deepEqual(session, {provider: 'oauth2', dynamic: {transport}, response: {
                access_token: 'token',
                refresh_token: 'refresh',
                raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
              }})
            }
          })
        })
      })
    })
  })

  describe('transport state', () => {
    ;['express', 'koa', 'koa-before', 'hapi'].forEach((handler) => {
      describe(handler, () => {
        before(async () => {
          client = await Client({test: 'transport-state', handler, config: {
            defaults: {...config.defaults, transport: 'state'},
            oauth2: config.oauth2
          }})
        })

        after(async () => {
          await client.close()
        })

        it('success', async () => {
          var {body: {response, session, state}} = await request({
            url: client.url('/connect/oauth2'),
            cookie: {},
          })
          t.deepEqual(response, {
            access_token: 'token',
            refresh_token: 'refresh',
            raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
          })
          t.deepEqual(session, {provider: 'oauth2'})
          t.deepEqual(state, {
            response: {
              access_token: 'token',
              refresh_token: 'refresh',
              raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
            }
          })
        })
      })
    })
  })

  describe('third-party middlewares', () => {
    ;['koa-mount', 'express-cookie'].forEach((handler) => {
      describe(handler, () => {
        before(async () => {
          client = await Client({test: 'third-party', handler, config})
        })

        after(async () => {
          await client.close()
        })

        it('success', async () => {
          var {body: {response}} = await request({
            url: client.url('/connect/oauth2'),
            cookie: {},
          })
          t.deepEqual(response, {
            access_token: 'token',
            refresh_token: 'refresh',
            raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
          })
        })
      })
    })
  })

  describe('extend + hook', () => {
    ;['express', 'koa', 'hapi'].forEach((handler) => {
      describe(handler, () => {
        before(async () => {
          var state = {grant: 'simov'}
          var hook = ({get, set}) =>
            get ? Promise.resolve(state[get]) :
            set ? (state[set.id] = set.value, Promise.resolve()) :
            Promise.resolve()
          var extend = [
            ({hook}) => async ({provider, input, output}) => {
              output.profile = await hook({get: 'grant'})
              await hook({set: {id: 'grant', value: 'purest'}})
              t.deepEqual(state, {grant: 'purest'})
              return {provider, input, output}
            }
          ]
          client = await Client({test: 'extend-hook', handler, config, hook, extend})
        })

        after(async () => {
          await client.close()
        })

        it('success', async () => {
          var {body: {response}} = await request({
            url: client.url('/connect/oauth2'),
            cookie: {},
          })
          t.deepEqual(response, {
            access_token: 'token',
            refresh_token: 'refresh',
            raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'},
            profile: 'simov'
          })
        })
      })
    })
  })
})
