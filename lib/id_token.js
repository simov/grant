
module.exports = (provider, body, session) => {

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
