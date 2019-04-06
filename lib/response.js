
var credentials = (provider, body) => {
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
    if (body.oauth_token) {
      data.access_token = body.oauth_token
    }
    if (body.oauth_token_secret) {
      data.access_secret = body.oauth_token_secret
    }
  }
  else if (provider.oauth === 2) {
    if (body.id_token) {
      data.id_token = body.id_token
    }
    if (body.access_token) {
      data.access_token = body.access_token
    }
    if (body.refresh_token) {
      data.refresh_token = body.refresh_token
    }
  }

  return data
}

var oidc = (provider, body, session) => {
  if (!/^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/.test(body.id_token)) {
    return {error: 'Grant: OpenID Connect invalid id_token format'}
  }
  var [header, payload, signature] = body.id_token.split('.')

  try {
    header = JSON.parse(Buffer.from(header, 'base64').toString('binary'))
    payload = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
  }
  catch (err) {
    return {error: 'Grant: OpenID Connect error decoding id_token'}
  }

  if (![].concat(payload.aud).includes(provider.key)) {
    return {error: 'Grant: OpenID Connect invalid id_token audience'}
  }
  else if ((payload.nonce && session.nonce) && (payload.nonce !== session.nonce)) {
    return {error: 'Grant: OpenID Connect nonce mismatch'}
  }

  return {header, payload, signature}
}

module.exports = (provider, body, session) => {
  var data = credentials(provider, body)

  if (data.id_token) {
    var jwt = oidc(provider, body, session)
    if (jwt.error) {
      return jwt
    }
    data.id_token = jwt
  }

  if (provider.response) {
    if (body.id_token) {
      data.id_token = body.id_token
    }
    if (jwt && [].concat(provider.response).includes('jwt')) {
      data.id_token_jwt = jwt
    }
  }
  else {
    data.raw = body
  }

  return data
}
