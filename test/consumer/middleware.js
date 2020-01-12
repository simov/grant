
var t = require('assert')

var request = require('request-compose').extend({
  Request: {cookie: require('request-cookie').Request},
  Response: {cookie: require('request-cookie').Response},
}).client

var port = {oauth2: 5001, app: 5002}
var url = {
  oauth2: (path) => `http://localhost:${port.oauth2}${path}`,
  app: (path) => `http://localhost:${port.app}${path}`,
}

var provider = require('./util/provider')
var client = require('./util/client')


describe('middleware', () => {
  var server = {oauth2: null}

  before(async () => {
    server.oauth2 = await provider.oauth2(port.oauth2)
  })

  after((done) => {
    server.oauth2.close(done)
  })

  describe('path prefix', () => {
    var server
    var config = {
      defaults: {
        protocol: 'http', host: `localhost:${port.app}`, callback: '/',
        path: '/prefix',
      },
      oauth2: {
        authorize_url: url.oauth2('/authorize_url'),
        access_url: url.oauth2('/access_url'),
        oauth: 2,
      }
    }

    ;['express-prefix', 'koa-prefix', 'hapi-prefix'].forEach((consumer) => {
      describe(consumer, () => {
        before(async () => {
          var obj = await client[consumer](config, port.app)
          server = obj.server
        })

        after((done) => {
          server[/express|koa/.test(consumer) ? 'close' : 'stop'](done)
        })

        it('success', async () => {
          var {body: {response}} = await request({
            url: url.app('/prefix/connect/oauth2'),
            cookie: {},
          })
          t.deepEqual(response, {
            access_token: 'token',
            refresh_token: 'refresh',
            raw: {
              access_token: 'token',
              refresh_token: 'refresh',
              expires_in: '3600'
            }
          })
        })
      })
    })
  })

  describe('third-party middlewares', () => {
    var server
    var config = {
      defaults: {
        protocol: 'http', host: `localhost:${port.app}`, callback: '/',
      },
      oauth2: {
        authorize_url: url.oauth2('/authorize_url'),
        access_url: url.oauth2('/access_url'),
        oauth: 2,
      }
    }

    ;['koa', 'koa-mount', 'express', 'express-cookie'].forEach((consumer) => {
      describe(consumer, () => {
        before(async () => {
          var obj = await client[consumer](config, port.app)
          server = obj.server
        })

        after((done) => {
          server.close(done)
        })

        it('success', async () => {
          var {body: {response}} = await request({
            url: url.app('/connect/oauth2'),
            cookie: {},
          })
          t.deepEqual(response, {
            access_token: 'token',
            refresh_token: 'refresh',
            raw: {
              access_token: 'token',
              refresh_token: 'refresh',
              expires_in: '3600'
            }
          })
        })
      })
    })
  })

  describe('dynamic state', () => {
    var server
    var config = {
      defaults: {
        protocol: 'http', host: `localhost:${port.app}`, callback: '/',
      },
      oauth2: {
        authorize_url: url.oauth2('/authorize_url'),
        access_url: url.oauth2('/access_url'),
        oauth: 2,
      }
    }

    ;['express', 'koa', 'hapi'].forEach((consumer) => {
      describe(consumer, () => {
        before(async () => {
          var obj = await client.state[consumer](config, port.app)
          server = obj.server
        })

        after((done) => {
          server[/express|koa/.test(consumer) ? 'close' : 'stop'](done)
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
              redirect_uri: 'http://localhost:5002/connect/oauth2/callback'
            })
          }
          provider.oauth2.access = ({form}) => {
            t.deepEqual(form, {
              grant_type: 'authorization_code',
              code: 'code',
              client_id: 'very',
              client_secret: 'secret',
              redirect_uri: 'http://localhost:5002/connect/oauth2/callback'
            })
          }
          var {body: {response, session}} = await request({
            url: url.app('/connect/oauth2'),
            cookie: {},
          })
          t.deepEqual(response, {
            access_token: 'token',
            refresh_token: 'refresh',
            raw: {
              access_token: 'token',
              refresh_token: 'refresh',
              expires_in: '3600'
            }
          })
          t.deepEqual(session, {provider: 'oauth2'})
        })
      })
    })
  })

  describe('transport state', () => {
    var server
    var config = {
      defaults: {
        protocol: 'http', host: `localhost:${port.app}`, transport: 'state',
      },
      oauth2: {
        authorize_url: url.oauth2('/authorize_url'),
        access_url: url.oauth2('/access_url'),
        oauth: 2,
      }
    }

    ;['express', 'koa', 'koa-before', 'hapi'].forEach((consumer) => {
      describe(consumer, () => {
        before(async () => {
          var obj = await client.transport[consumer](config, port.app)
          server = obj.server
        })

        after((done) => {
          server[/express|koa/.test(consumer) ? 'close' : 'stop'](done)
        })

        it('success', async () => {
          var {body: {response, session, state}} = await request({
            url: url.app('/connect/oauth2'),
            cookie: {},
          })
          t.deepEqual(response, {
            access_token: 'token',
            refresh_token: 'refresh',
            raw: {
              access_token: 'token',
              refresh_token: 'refresh',
              expires_in: '3600'
            }
          })
          t.deepEqual(session, {provider: 'oauth2'})
          t.deepEqual(state, {
            response: {
              access_token: 'token',
              refresh_token: 'refresh',
              raw: {
                access_token: 'token',
                refresh_token: 'refresh',
                expires_in: '3600'
              }
            }
          })
        })
      })
    })
  })

})
