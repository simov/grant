
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

var port = {oauth1: 5000, oauth2: 5001, app: 5002}
var url = {
  oauth1: (path) => `http://localhost:${port.oauth1}${path}`,
  oauth2: (path) => `http://localhost:${port.oauth2}${path}`,
  app: (path) => `http://localhost:${port.app}${path}`,
}

var provider = require('./util/provider')
var client = require('./util/client')


describe('consumer - session', () => {
  var server = {oauth1: null, oauth2: null}

  before(async () => {
    server.oauth1 = await provider.oauth1(port.oauth1)
    server.oauth2 = await provider.oauth2(port.oauth2)
  })

  after((done) => {
    server.oauth1.close(() => server.oauth2.close(done))
  })

  ;['express', 'koa', 'hapi'].forEach((name) => {
    describe(name, () => {
      var server, grant, consumer = name
      var config = {
        defaults: {
          protocol: 'http', host: `localhost:${port.app}`, callback: '/',
          dynamic: true
        },
        oauth1: {
          request_url: url.oauth1('/request_url'),
          authorize_url: url.oauth1('/authorize_url'),
          access_url: url.oauth1('/access_url'),
          oauth: 1,
        },
        oauth2: {
          authorize_url: url.oauth2('/authorize_url'),
          access_url: url.oauth2('/access_url'),
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

      it('provider', async () => {
        var {body: {session}} = await request({
          url: url.app('/connect/oauth2'),
          cookie: {},
        })
        t.deepEqual(session, {provider: 'oauth2'})
      })

      it('override', async () => {
        var {body: {session}} = await request({
          url: url.app('/connect/oauth2/contacts'),
          cookie: {},
        })
        t.deepEqual(session, {provider: 'oauth2', override: 'contacts'})
      })

      it('dynamic - POST', async () => {
        var {body: {session}} = await request({
          method: 'POST',
          url: url.app('/connect/oauth2/contacts'),
          form: {scope: ['scope1', 'scope2'], state: 'Grant', nonce: 'simov'},
          cookie: {},
          redirect: {all: true, method: false},
        })
        t.deepEqual(session, {provider: 'oauth2', override: 'contacts',
          dynamic: {scope: ['scope1', 'scope2'], state: 'Grant', nonce: 'simov'},
          state: 'Grant', nonce: 'simov'
        })
      })

      it('dynamic - GET', async () => {
        var {body: {session}} = await request({
          url: url.app('/connect/oauth2/contacts'),
          qs: {scope: ['scope1', 'scope2'], state: 'Grant', nonce: 'simov'},
          cookie: {},
        })
        t.deepEqual(session, {provider: 'oauth2', override: 'contacts',
          dynamic: {scope: ['scope1', 'scope2'], state: 'Grant', nonce: 'simov'},
          state: 'Grant', nonce: 'simov'
        })
      })

      it('dynamic - non configured provider', async () => {
        t.equal(grant.config.google, undefined)

        var {body: {session}} = await request({
          url: url.app('/connect/google'),
          qs: {
            authorize_url: url.oauth2('/authorize_url'),
            access_url: url.oauth2('/access_url'),
            scope: ['scope1', 'scope2'], state: 'Grant', nonce: 'simov',
          },
          cookie: {},
        })
        t.deepEqual(session, {
          provider: 'google',
          dynamic: {
            authorize_url: 'http://localhost:5001/authorize_url',
            access_url: 'http://localhost:5001/access_url',
            scope: ['scope1', 'scope2'], state: 'Grant', nonce: 'simov',
          },
          state: 'Grant', nonce: 'simov'
        })
      })

      it('dynamic - non existing provider', async () => {
        t.equal(grant.config.grant, undefined)

        var {body: {session}} = await request({
          url: url.app('/connect/grant'),
          qs: {
            authorize_url: url.oauth2('/authorize_url'),
            access_url: url.oauth2('/access_url'),
            oauth: 2,
          },
          cookie: {},
        })
        t.equal(grant.config.grant, undefined)
        t.deepEqual(session, {
          provider: 'grant',
          dynamic: {
            authorize_url: 'http://localhost:5001/authorize_url',
            access_url: 'http://localhost:5001/access_url',
            oauth: '2',
          }
        })
      })

      it('auto generated state and nonce', async () => {
        grant.config.oauth2.state = true
        grant.config.oauth2.nonce = true
        var {body: {session}} = await request({
          url: url.app('/connect/oauth2'),
          cookie: {},
        })
        t.ok(/\d+/.test(session.state))
        t.ok(typeof session.state === 'string')
        t.ok(/\d+/.test(session.nonce))
        t.ok(typeof session.nonce === 'string')
      })

      it('oauth1', async () => {
        var {body: {session}} = await request({
          url: url.app('/connect/oauth1'),
          cookie: {},
        })
        t.deepEqual(session, {
          provider: 'oauth1',
          request: {oauth_token: 'token', oauth_token_secret: 'secret'}
        })
      })

      after((done) => {
        consumer === 'hapi' && hapi >= 17
          ? server.stop().then(done)
          : server[/express|koa/.test(consumer) ? 'close' : 'stop'](done)
      })
    })
  })

})
