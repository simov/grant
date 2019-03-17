const request = require('request-compose').extend({
  Request: {oauth: require('request-oauth')}
}).client

const requestOptions = {
  twitter (options, data) {
    return {
      ...options,
      qs: {user_id: data.raw && data.raw.user_id}
    }
  }
}

module.exports = (data, provider) => {
  const options = {url: provider.profile_url}
  const getOptions = requestOptions[provider.name] || (op => op)

  if (provider.oauth === 1) {
    options.oauth = {
      consumer_key: provider.key,
      consumer_secret: provider.secret,
      token: data.access_token,
      token_secret: data.access_secret,
    }
  } else if (provider.oauth === 2) {
    options.headers = {authorization: `Bearer ${data.access_token}`}
  }

  const {body} = await request(getOptions(options))

  return body
}