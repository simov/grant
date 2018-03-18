
module.exports = (provider, body) => {
  var data = {}

  if (provider.concur) {
    data.access_token = body.replace(
      /[\s\S]+<Token>([^<]+)<\/Token>[\s\S]+/, '$1')
    data.refresh_token = body.replace(
      /[\s\S]+<Refresh_Token>([^<]+)<\/Refresh_Token>[\s\S]+/, '$1')
  }
  else if (provider.elance) {
    data.access_token = body.data.access_token
    data.refresh_token = body.data.refresh_token
  }
  else if (provider.getpocket) {
    data.access_token = body.access_token
  }
  else if (provider.yammer) {
    data.access_token = body.access_token.token
  }

  else if (/^1$/.test(provider.oauth)) {
    for (var key in body) {
      if (key === 'oauth_token') {
        data.access_token = body.oauth_token
      }
      else if (key === 'oauth_token_secret') {
        data.access_secret = body.oauth_token_secret
      }
    }
  }
  else if (/^2$/.test(provider.oauth)) {
    for (var key in body) {
      if (key === 'access_token') {
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
