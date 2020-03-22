
var qs = require('qs')

var _config = require('./config')
var oauth1 = require('./flow/oauth1')
var oauth2 = require('./flow/oauth2')

var dcopy = (obj) =>
  JSON.parse(JSON.stringify(obj))


module.exports = ({config}) => {
  var config = _config(config)

  var consumer = async ({method, params, query, body, state, session}) => {
    method = method.toUpperCase()
    params = dcopy(params || {})
    query = dcopy(query || {})
    body = dcopy(body || {})
    state = dcopy(state || {})
    session = dcopy(params.override === 'callback' ? (session || {}) : {})

    if (method === 'GET' && params.override === 'callback') {
      var {error, url} = await callback({session, query, state}) // mutates session/state
      return {error, url, session, state}
    }

    else {
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

      var {error, url} = await connect({session, state}) // mutates session
      return {error, url, session, state}
    }
  }

  var connect = async ({session, state = {}}) => {
    var provider = _config.provider(config, session, state)
    var response = transport(provider, session, state)

    if (provider.oauth === 1) {
      try {
        var {body} = await oauth1.request(provider)
        session.request = body
        var url = await oauth1.authorize(provider, body)
        return {url}
      }
      catch (err) {
        return response(err)
      }
    }

    else if (provider.oauth === 2) {
      session.state = provider.state
      session.nonce = provider.nonce
      session.code_verifier = provider.code_verifier
      try {
        var url = await oauth2.authorize(provider)
        return {url}
      }
      catch (err) {
        return response(err)
      }
    }

    else {
      return response({error: 'Grant: missing or misconfigured provider'})
    }
  }

  var callback = async ({session, query, state = {}}) => {
    var provider = _config.provider(config, session, state)
    var response = transport(provider, session, state)

    if (provider.oauth === 1) {
      try {
        var data = await oauth1.access(provider, session.request, query)
        return response(data)
      }
      catch (err) {
        return response(err)
      }
    }

    else if (provider.oauth === 2) {
      try {
        var data = await oauth2.access(provider, query, session)
        return response(data)
      }
      catch (err) {
        return response(err)
      }
    }

    else {
      return response({error: 'Grant: missing session or misconfigured provider'})
    }
  }

  return Object.assign(consumer, {config, connect, callback})
}

var transport = (provider, session, state) => (data) => {
  if (!provider.transport || provider.transport === 'querystring') {
    return {url: `${provider.callback || ''}?${qs.stringify(data)}`}
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
    return {error: 'Grant: Unknown transport'}
  }
}
