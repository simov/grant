
var qs = require('qs')

var _config = require('./config')
var oauth1 = require('./flow/oauth1')
var oauth2 = require('./flow/oauth2')


module.exports = ({config}) => {
  var config = _config(config)

  var connect = ({session, state = {}}) => new Promise((resolve) => {
    var provider = _config.provider(config, session, state)
    var response = transport(provider, session, state)

    if (provider.oauth === 1) {
      oauth1.request(provider)
        .then((result) => {
          session.request = result.body
          oauth1.authorize(provider, result.body)
            .then((url) => resolve({url}))
        })
        .catch((err) => resolve(response(err)))
    }

    else if (provider.oauth === 2) {
      session.state = provider.state
      session.nonce = provider.nonce
      session.code_verifier = provider.code_verifier
      oauth2.authorize(provider)
        .then((url) => resolve({url}))
        .catch((err) => resolve(response(err)))
    }

    else {
      resolve(response({error: 'Grant: missing or misconfigured provider'}))
    }
  })

  var callback = ({session, query, state = {}}) => new Promise((resolve) => {
    var provider = _config.provider(config, session, state)
    var response = transport(provider, session, state)

    if (provider.oauth === 1) {
      oauth1.access(provider, session.request, query)
        .then((data) => resolve(response(data)))
        .catch((err) => resolve(response(err)))
    }

    else if (provider.oauth === 2) {
      oauth2.access(provider, query, session)
        .then((data) => resolve(response(data)))
        .catch((err) => resolve(response(err)))
    }

    else {
      resolve(response({error: 'Grant: missing session or misconfigured provider'}))
    }
  })

  return {config, connect, callback}
}

var transport = (provider, session, state) => (data) => {
  if (!provider.transport || provider.transport === 'querystring') {
    return provider.callback
      ? {url: `${provider.callback}?${qs.stringify(data)}`}
      : {error: qs.stringify(data)}
  }
  else if (provider.transport === 'session') {
    session.response = data
    return provider.callback ? {url: provider.callback} : {}
  }
  else if (provider.transport === 'state') {
    state.response = data
    return {}
  }
  else {
    return {error: qs.stringify(data)}
  }
}
