
var t = require('assert')

var request = require('request-compose').extend({
  Request: {cookie: require('request-cookie').Request},
  Response: {cookie: require('request-cookie').Response},
}).client

var Provider = require('../util/provider'), provider
var Client = require('../util/client'), client

var mw = require('../../lib/profile')
var oauth = require('../../config/oauth')


describe('profile', () => {
  before(async () => {
    provider = {
      oauth2: await Provider({flow: 'oauth2', port: 5000}),
      oauth1: await Provider({flow: 'oauth1', port: 5002}),
    }
    var config = {
      defaults: {
        origin: 'http://localhost:5001', callback: '/',
        response: ['tokens', 'profile'],
        key: 'key', secret: 'secret',
        dynamic: true,
      },
      oauth2: {
        authorize_url: provider.oauth2.url('/oauth2/authorize_url'),
        access_url: provider.oauth2.url('/oauth2/access_url'),
        profile_url: provider.oauth2.url('/oauth2/profile_url'),
        oauth: 2,
      },
      oauth1: {
        request_url: provider.oauth1.url('/oauth1/request_url'),
        authorize_url: provider.oauth1.url('/oauth1/authorize_url'),
        access_url: provider.oauth1.url('/oauth1/access_url'),
        profile_url: provider.oauth1.url('/oauth1/profile_url'),
        oauth: 1,
      }
    }
    client = await Client({test: 'handlers', handler: 'express', config})
  })

  after(async () => {
    await provider.oauth2.close()
    await provider.oauth1.close()
    await client.close()
    provider.oauth2.on.profile = () => {}
    provider.oauth1.on.profile = () => {}
  })

  it('oauth2', async () => {
    var {body: {response}} = await request({
      url: client.url('/connect/oauth2'),
      cookie: {},
    })
    t.deepEqual(response, {
      access_token: 'token', refresh_token: 'refresh',
      profile: {user: 'simov'}
    })
  })

  it('oauth1', async () => {
    var {body: {response}} = await request({
      url: client.url('/connect/oauth1'),
      cookie: {},
    })
    t.deepEqual(response, {
      access_token: 'token', access_secret: 'secret',
      profile: {user: 'simov'}
    })
  })

  it('no profile_url', async () => {
    var {body: {response}} = await request({
      url: client.url('/connect/oauth2'),
      qs: {
        profile_url: '',
      },
      cookie: {},
    })
    t.deepEqual(response, {
      access_token: 'token', refresh_token: 'refresh',
      profile: {error: 'Grant: No profile URL found!'}
    })
  })

  it('subdomain', async () => {
    var {body: {response}} = await request({
      url: client.url('/connect/oauth2'),
      qs: {
        profile_url: provider.oauth2.url('[subdomain]'),
        subdomain: '/oauth2/profile_url',
      },
      cookie: {},
    })
    t.deepEqual(response, {
      access_token: 'token', refresh_token: 'refresh',
      profile: {user: 'simov'}
    })
  })

  it('error', async () => {
    var {body: {response}} = await request({
      url: client.url('/connect/oauth2'),
      qs: {
        profile_url: provider.oauth2.url('/oauth2/profile_error'),
      },
      cookie: {},
    })
    t.deepEqual(response, {
      access_token: 'token', refresh_token: 'refresh',
      profile: {error: {error: {message: 'Not Found'}}}
    })
  })

  it('custom', async () => {
    var providers = [
      'arcgis',
      'constantcontact',
      'baidu',
      'deezer',
      'disqus',
      'dropbox',
      'echosign',
      'flickr',
      'foursquare',
      // 'getpocket',
      // 'instagram',
      'linkedin',
      'mailchimp',
      'meetup',
      'mixcloud',
      'shopify',
      'slack',
      'soundcloud',
      'stackexchange',
      'stocktwits',
      'tiktok',
      'tumblr',
      'vk',
      'wechat',
      'weibo',
      'twitter',
    ]
    for (var name of providers) {
      var version = oauth[name].oauth
      provider[`oauth${version}`].on.profile = ({method, query, headers, form}) => {
        'arcgis' === name ? t.equal(query.f, 'json') :
        'constantcontact' === name ? t.equal(query.api_key, 'key') :
        'baidu' === name ? t.equal(query.access_token, 'token') :
        'deezer' === name ? t.equal(query.access_token, 'token') :
        'disqus' === name ? t.equal(query.api_key, 'key') :
        'dropbox' === name ? t.equal(method, 'POST') :
        'echosign' === name ? t.equal(headers['access-token'], 'token') :
        'flickr' === name ? t.deepEqual(query, {method: 'flickr.urls.getUserProfile', api_key: 'key', format: 'json'}) :
        'foursquare' === name ? t.equal(query.oauth_token, 'token') :
        'getpocket' === name ? t.deepEqual(query, {consumer_key: 'key', access_token: 'token'}) :
        'instagram' === name ? t.equal(query.access_token, 'token') :
        'mailchimp' === name ? t.equal(query.apikey, 'token') :
        'meetup' === name ? t.equal(query.member_id, 'self') :
        'mixcloud' === name ? t.equal(query.access_token, 'token') :
        'shopify' === name ? t.equal(headers['x-shopify-access-token'], 'token') :
        'slack' === name ? t.equal(query.token, 'token') :
        'soundcloud' === name ? t.equal(query.oauth_token, 'token') :
        'stackexchange' === name ? t.equal(query.key, 'token') :
        'stocktwits' === name ? t.equal(query.access_token, 'token') :
        'tiktok' === name ? (t.equal(method, 'POST'), t.deepEqual(form, {access_token: 'token', open_id: 'id', fields: ['open_id', 'union_id', 'avatar_url', 'display_name']})) :
        'tumblr' === name ? t.equal(query.api_key, 'token') :
        'vk' === name ? t.deepEqual(query, {access_token: 'token', v: '5.103'}) :
        'wechat' === name ? t.deepEqual(query, {access_token: 'token', openid: 'openid', lang: 'zh_CN'}) :
        'weibo' === name ? t.deepEqual(query, {access_token: 'token', uid: 'id'}) :
        'twitter' === name ? t.equal(query.user_id, 'id') :
        undefined
      }
      var {body: {response}} = await request({
        url: client.url(`/connect/${name}`),
        qs: {
          request_url: provider[`oauth${version}`].url(`/${name}/request_url`),
          authorize_url: provider[`oauth${version}`].url(`/${name}/authorize_url`),
          access_url: provider[`oauth${version}`].url(`/${name}/access_url`),
          profile_url: provider[`oauth${version}`].url(`/${name}/profile_url`),
          response: ['tokens', 'raw', 'profile']
        },
        cookie: {},
      })
      delete response.raw
      if (version === 2) {
        t.deepEqual(response, {
          access_token: 'token', refresh_token: 'refresh',
          profile: {user: 'simov'}
        })
      }
      else if (version === 1) {
        t.deepEqual(response, {
          access_token: 'token', access_secret: 'secret',
          profile: {user: 'simov'}
        })
      }
    }
  })

})
