
var qs = require('qs')

var _config = require('./config')
var oauth1 = require('./flow/oauth1')
var oauth2 = require('./flow/oauth2')


module.exports = ({config}) => {
  var config = _config(config)

  var connect = ({state}) => new Promise((resolve) => {
    var provider = _config.provider(config, state)
    var response = transport(provider, state)

    if (provider.oauth === 1) {
      oauth1.request(provider)
        .then((result) => {
          state.request = result.body
          oauth1.authorize(provider, result.body)
            .then((url) => resolve({url}))
        })
        .catch((err) => resolve(response(err)))
    }

    else if (provider.oauth === 2) {
      state.state = provider.state
      state.nonce = provider.nonce
      oauth2.authorize(provider)
        .then((url) => resolve({url}))
        .catch((err) => resolve(response(err)))
    }

    else {
      resolve(response({error: 'Grant: missing or misconfigured provider'}))
    }
  })

  var callback = ({state, query}) => new Promise((resolve) => {
    var provider = _config.provider(config, state)
    var response = transport(provider, state)

    if (provider.oauth === 1) {
      oauth1.access(provider, state.request, query)
        .then((data) => resolve(response(data)))
        .catch((err) => resolve(response(err)))
    }

    else if (provider.oauth === 2) {
      oauth2.access(provider, query, state)
        .then((data) => resolve(response(data)))
        .catch((err) => resolve(response(err)))
    }

    else {
      resolve(response({error: 'Grant: missing session or misconfigured provider'}))
    }
  })

  return {config, connect, callback}
}

var transport = (provider, state) => (data) => {
  if (!provider.callback) {
    return {error: qs.stringify(data)}
  }
  else if (!provider.transport || provider.transport === 'querystring') {
    return {url: `${provider.callback}?${qs.stringify(data)}`}
  }
  else if (provider.transport === 'session') {
    state.response = data
    return {url: provider.callback}
  }
}
