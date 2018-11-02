
var id_token = require('./id_token')


module.exports = (provider, body, session) => {
  var data = {}

  if (provider.concur) {
    data.access_token = body.replace(
      /[\s\S]+<Token>([^<]+)<\/Token>[\s\S]+/, '$1')
    data.refresh_token = body.replace(
      /[\s\S]+<Refresh_Token>([^<]+)<\/Refresh_Token>[\s\S]+/, '$1')
  }
  else if (provider.getpocket) {
    data.access_token = body.access_token
  }
  else if (provider.yammer) {
    data.access_token = body.access_token.token
  }

  else if (provider.oauth === 1) {
    for (var key in body) {
      if (key === 'oauth_token') {
        data.access_token = body.oauth_token
      }
      else if (key === 'oauth_token_secret') {
        data.access_secret = body.oauth_token_secret
      }
    }
  }
  else if (provider.oauth === 2) {
    for (var key in body) {
      if (key === 'id_token') {
        var jwt = id_token(provider, body, session)
        if (jwt.error) {
          return jwt
        }
        data.id_token = jwt
      }
      else if (key === 'access_token') {
        data.access_token = body.access_token
      }
      else if (key === 'refresh_token') {
        data.refresh_token = body.refresh_token
      }
    }
  }

  data.raw = body
  return data
}
