
var t = require('assert')

var request = require('request-compose').extend({
  Request: {cookie: require('request-cookie').Request},
  Response: {cookie: require('request-cookie').Response},
}).client

var hapi = (() => {
  try {
    return parseInt(require('hapi/package.json').version.split('.')[0])
  }
  catch (err) {
    return parseInt(require('@hapi/hapi/package.json').version.split('.')[0])
  }
})()

var port = {auth: 5000, app: 5001}
var url = {
  auth: (path) => `http://localhost:${port.auth}${path}`,
  app: (path) => `http://localhost:${port.app}${path}`,
}

var provider = require('./util/provider')
var client = require('./util/client')


describe('consumer - flow', () => {

  describe('oauth1', () => {
    var server

    before(async () => {
      server = await provider.oauth1(port.auth)
    })

    ;['express', 'koa', 'hapi'].forEach((name) => {
      describe(name, () => {
        var server, grant, consumer = name
        var config = {
          defaults: {
            protocol: 'http', host: `localhost:${port.app}`, callback: '/'
          },
          grant: {
            request_url: url.auth('/request_url'),
            authorize_url: url.auth('/authorize_url'),
            access_url: url.auth('/access_url'),
            oauth: 1,
          }
        }

        before(async () => {
          var obj = await client[
            consumer === 'hapi' ? `${consumer}${hapi < 17 ? '' : '17'}` : consumer
          ](config, port.app)
          server = obj.server
          grant = obj.grant
        })

        it('flow', async () => {
          var assert = async (message) => {
            var {body: {response}} = await request({
              url: url.app('/connect/grant'),
              cookie: {},
            })
            t.deepEqual(response, {
              access_token: 'token', access_secret: 'secret',
              raw: {oauth_token: 'token', oauth_token_secret: 'secret'}
            }, message)
          }
          delete grant.config.grant.transport
          await assert('no transport')
          grant.config.grant.transport = 'querystring'
          await assert('querystring transport')
          grant.config.grant.transport = 'session'
          await assert('session transport')
        })

        after((done) => {
          consumer === 'hapi' && hapi >= 17
            ? server.stop().then(done)
            : server[/express|koa/.test(consumer) ? 'close' : 'stop'](done)
        })
      })
    })

    after((done) => {
      server.close(done)
    })
  })

  describe('oauth2', () => {
    var server

    before(async () => {
      server = await provider.oauth2(port.auth)
    })

    ;['express', 'koa', 'hapi'].forEach((name) => {
      describe(name, () => {
        var server, grant, consumer = name
        var config = {
          defaults: {protocol: 'http', host: `localhost:${port.app}`, callback: '/'},
          grant: {
            authorize_url: url.auth('/authorize_url'),
            access_url: url.auth('/access_url'),
            oauth: 2,
          }
        }

        before(async () => {
          var obj = await client[
            consumer === 'hapi' ? `${consumer}${hapi < 17 ? '' : '17'}` : consumer
          ](config, port.app)
          server = obj.server
          grant = obj.grant
        })

        it('flow', async () => {
          var assert = async (message) => {
            var {body: {response}} = await request({
              url: url.app('/connect/grant'),
              cookie: {},
            })
            t.deepEqual(response, {
              access_token: 'token', refresh_token: 'refresh',
              raw: {access_token: 'token', refresh_token: 'refresh', expires_in: '3600'}
            }, message)
          }
          delete grant.config.grant.transport
          await assert('no transport')
          grant.config.grant.transport = 'querystring'
          await assert('querystring transport')
          grant.config.grant.transport = 'session'
          await assert('session transport')
        })

        after((done) => {
          consumer === 'hapi' && hapi >= 17
            ? server.stop().then(done)
            : server[/express|koa/.test(consumer) ? 'close' : 'stop'](done)
        })
      })
    })

    after((done) => {
      server.close(done)
    })
  })

})
