
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
var client = require('./util/koa-mount')


describe('middleware', () => {
  var server = {oauth2: null}

  before(async () => {
    server.oauth2 = await provider.oauth2(port.oauth2)
  })

  after((done) => {
    server.oauth2.close(done)
  })

  describe('koa', () => {
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

    ;['mount', 'nomount'].forEach((name) => {
      describe(name, () => {
        before(async () => {
          var obj = await client[name](config, port.app)
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

})
