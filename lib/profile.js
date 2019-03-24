const request = require('request-compose').extend({
  Request: {oauth: require('request-oauth')}
}).client

const requestOptions = {
  twitter (options, data) {
    return Object.assign({
      qs: {user_id: data.raw && data.raw.user_id}
    }, options);
  }
}

module.exports = (data, provider) => {
  try {
    var options = {url: provider.profile_url}
    var getOptions = requestOptions[provider.name] || (op => op)
  
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
  
    return request(getOptions(options, data)).then(({body}) => body);
  } catch (error) {
    return Promise.reject(error)
  }
}