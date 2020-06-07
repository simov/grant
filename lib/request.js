
var {compose, dcopy} = require('./util')
var _config = require('./config')
var oauth1 = require('./flow/oauth1')
var oauth2 = require('./flow/oauth2')


var defaults = (config) => ({method, params, query, body, state, session}) => {
  method = method.toUpperCase()
  params = dcopy(params || {})
  query = dcopy(query || {})
  body = dcopy(body || {})
  state = dcopy(state || {})
  session = dcopy(params.override === 'callback' ? (session || {}) : {})

  if (params.override !== 'callback') {
    session.provider = params.provider

    if (params.override) {
      session.override = params.override
    }
    if (method === 'GET' && Object.keys(query).length) {
      session.dynamic = query
    }
    else if (method === 'POST' && Object.keys(body).length) {
      session.dynamic = body
    }
  }

  var provider = _config.provider(config, session, state)
  return {provider, input: {method, params, query, body, state, session}}
}

var connect = ({request}) => ({provider, input, input:{session}, output}) =>
    provider.oauth === 1
  ? compose(
      oauth1.request({request}),
      ({provider, input, input:{session}, output}) => (
        session.request = output,
        oauth1.authorize({provider, input, output})
      )
    )({provider, input})

  : provider.oauth === 2
  ? (
    session.state = provider.state,
    session.nonce = provider.nonce,
    session.code_verifier = provider.code_verifier,
    oauth2.authorize({provider, input})
  )

  : (
    output = {error: 'Grant: missing or misconfigured provider'},
    {provider, input, output}
  )

var callback = ({request}) => ({provider, input, output}) =>
    provider.oauth === 1
  ? oauth1.access({request})

  : provider.oauth === 2
  ? oauth2.access({request})

  : ({provider, input, output}) => (
    output = {error: 'Grant: missing session or misconfigured provider'},
    {provider, input, output}
  )

module.exports = {defaults, connect, callback}
