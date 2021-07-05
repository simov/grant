
var request = require('./client')


module.exports = ({request:client}) => async ({provider, input, output}) => {
  if (!provider.response || !provider.response.includes('profile')) {
    return {provider, input, output}
  }

  if (provider.apple && !provider.profile_url && input.body.user) {
    output.profile = input.body.user
    return {provider, input, output}
  }

  if (!provider.profile_url) {
    output.profile = {error: 'Grant: No profile URL found!'}
    return {provider, input, output}
  }

  var options = {
    method: 'GET',
    url: provider.profile_url,
    headers: {},
  }

  if (provider.oauth === 2) {
    options.headers.authorization = `Bearer ${output.access_token}`
  }
  else if (provider.oauth === 1) {
    options.oauth = {
      consumer_key: provider.key,
      consumer_secret: provider.secret,
      token: output.access_token,
      token_secret: output.access_secret,
    }
  }

  if (custom[provider.name]) {
    Object.assign(options, custom[provider.name]({provider, output}))
  }

  if (provider.subdomain) {
    options.url = options.url.replace('[subdomain]', provider.subdomain)
  }

  try {
    var {body} = await request({...client, ...options})
    // JSONP
    if (provider.flickr) {
      body = JSON.parse(/^.*\((.*)\)/.exec(body)[1])
    }
    // JSONP + secondary request
    if (provider.qq) {
      body = JSON.parse(/^.*\((.*)\)/.exec(Object.keys(body)[0])[1])
      body = {...body, ...(await request({...client, ...options,
        url: 'https://graph.qq.com/user/get_user_info',
        qs: {
          access_token: output.access_token,
          oauth_consumer_key: provider.key,
          openid: body.openid
        }
      })).body}

    }
    output.profile = body
  }
  catch (err) {
    output.profile = {error: err.body || err.message}
  }

  return {provider, input, output}
}

var custom = {
  arcgis: () => ({qs: {f: 'json'}}),
  baidu: ({output}) => ({qs: {access_token: output.access_token}}),
  constantcontact: ({provider}) => ({qs: {api_key: provider.key}}),
  deezer: ({output}) => ({qs: {access_token: output.access_token}}),
  disqus: ({provider}) => ({qs: {api_key: provider.key}}),
  dropbox: () => ({method: 'POST'}),
  echosign: ({output}) => ({headers: {'Access-Token': output.access_token}}),
  flickr: ({provider}) => ({qs: {method: 'flickr.urls.getUserProfile', api_key: provider.key, format: 'json'}}),
  foursquare: ({output}) => ({qs: {oauth_token: output.access_token}}),
  getpocket: ({provider, output}) => ({json: {consumer_key: provider.key, access_token: output.access_token}}),
  instagram: ({provider, output}) => /^\d+$/.test(provider.key) ? {qs: {fields: 'id,account_type,username'}} : {url: 'https://api.instagram.com/v1/users/self', qs: {access_token: output.access_token}},
  mailchimp: ({output}) => ({qs: {apikey: output.access_token}}),
  meetup: ({output}) => ({qs: {member_id: 'self'}}),
  mixcloud: ({output}) => ({qs: {access_token: output.access_token}}),
  qq: ({output}) => ({qs: {access_token: output.access_token}}),
  shopify: ({output}) => ({headers: {'X-Shopify-Access-Token': output.access_token}}),
  slack: ({output}) => ({qs: {token: output.access_token}}),
  soundcloud: ({output}) => ({qs: {oauth_token: output.access_token}}),
  stackexchange: ({output}) => ({qs: {key: output.access_token}}),
  stocktwits: ({output}) => ({qs: {access_token: output.access_token}}),
  tumblr: ({output}) => ({qs: {api_key: output.access_token}}),
  vk: ({output}) => ({qs: {access_token: output.access_token, v: '5.103'}}),
  wechat: ({output}) => ({qs: {access_token: output.access_token, openid: output.raw.openid, lang: 'zh_CN'}}),
  weibo: ({output}) => ({qs: {access_token: output.access_token, uid: output.raw.uid}}),
  twitch: ({provider, output}) => ({headers: {'client-id': provider.key, authorization: `Bearer ${output.access_token}`}}),
  twitter: ({output}) => ({qs: {user_id: output.raw.user_id}}),
}
