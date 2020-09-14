
var crypto = require('crypto')

var oauth = require('../config/oauth.json')
var reserved = require('../config/reserved.json')
var profile = require('../config/profile.json')


var compose = (...fns) =>
  fns.reduce((x, y) => (...args) => y(x(...args)))

var dcopy = (obj) =>
  JSON.parse(JSON.stringify(obj))

var merge = (...args) =>
  Object.assign(...args.filter(Boolean).map(dcopy))

var filter = (obj) => Object.keys(obj)
  .filter((key) =>
    // empty string
    obj[key] !== '' && (
    // provider name
    key === obj.name ||
    // reserved key
    reserved.includes(key)
  ))
  .reduce((all, key) => (all[key] = obj[key], all), {})

var format = {

  oauth: ({oauth}) =>
    parseInt(oauth) || undefined
  ,

  key: ({oauth, key, consumer_key, client_id}) =>
      oauth === 1
    ? key || consumer_key

    : oauth === 2
    ? key || client_id

    : undefined
  ,

  secret: ({oauth, secret, consumer_secret, client_secret}) =>
      oauth === 1
    ? secret || consumer_secret

    : oauth === 2
    ? secret || client_secret

    : undefined
  ,

  scope: ({scope, scope_delimiter = ','}) =>
      scope instanceof Array
    ? scope.filter(Boolean).join(scope_delimiter) || undefined

    : typeof scope === 'object'
    ? JSON.stringify(scope)

    : scope || undefined
  ,

  state: ({state}) =>
    state || undefined
  ,

  nonce: ({nonce}) =>
    nonce || undefined
  ,

  redirect_uri: ({redirect_uri, origin, prefix, protocol, host, name}) =>
      redirect_uri
    ? redirect_uri

    : origin
    ? `${origin}${prefix}/${name}/callback`

    : protocol && host
    ? `${protocol}://${host}${prefix}/${name}/callback`

    : undefined
  ,

  custom_params: (provider) => {
    var params = provider.custom_params || {}

    // remove falsy
    params = Object.keys(params)
      .filter((key) => params[key])
      .reduce((all, key) => (all[key] = params[key], all), {})

    return Object.keys(params).length ? params : undefined
  },

  overrides: (provider) => {
    var overrides = provider.overrides || {}
    delete provider.overrides

    // remove nested
    Object.keys(overrides).forEach((name) => {
      overrides[name] = Object.keys(overrides[name])
        .filter((key) => key !== 'overrides')
        .reduce((all, key) => (all[key] = overrides[name][key], all), {})
    })

    overrides = Object.keys(overrides)
      .reduce((all, key) => (all[key] = init(provider, overrides[key]), all), {})

    return Object.keys(overrides).length ? overrides : undefined
  },

}

var state = (provider, key = 'state', value = provider[key]) =>
    value === true || value === 'true'
  ? crypto.randomBytes(20).toString('hex')

  : value === 'false'
  ? undefined

  : /string|number/.test(typeof value)
  ? value.toString()

  : undefined

var pkce = (code_verifier = crypto.randomBytes(40).toString('hex')) => ({
  code_verifier,
  code_challenge: crypto.createHash('sha256')
    .update(code_verifier).digest().toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
})

var transform = (provider) => {

  Object.keys(format)
    .forEach((key) => provider[key] = format[key](provider))

  // filter undefined
  return dcopy(provider)
}

var init = compose(merge, filter, transform)

var compat = (config) =>
  config.fitbit2 ? (Object.assign({}, config, {fitbit2: Object.assign({}, oauth.fitbit, profile.fitbit, config.fitbit2)})) :
  config.linkedin2 ? (Object.assign({}, config, {linkedin2: Object.assign({}, oauth.linkedin, profile.linkedin, config.linkedin2)})) :
  config.zeit ? (Object.assign({}, config, {zeit: Object.assign({}, oauth.vercel, profile.vercel, config.zeit)})) :
  config

var defaults = ({path, prefix = '/connect', ...rest} = {}) => ({
  ...rest,
  prefix: path ? `${path}${prefix}` : prefix
})

// init all configured providers
var ctor = ((_defaults) => (config = {}, defaults = _defaults(config.defaults)) =>
  Object.keys(compat(config))
    .filter((name) => !/defaults/.test(name))
    .reduce((all, name) => (
      all[name] = init(oauth[name], profile[name], defaults, config[name], {name, [name]: true}),
      all
    ), {defaults})
)(defaults)

// get provider on connect
var provider = (config, session, _state = {}) => {
  var name = session.provider
  var provider = config[name]

  if (!provider) {
    if ((config.defaults || {}).dynamic !== true) {
      return {}
    }
    provider = init(oauth[name], profile[name], config.defaults, {name, [name]: true})
  }

  if (session.override && provider.overrides) {
    var override = provider.overrides[session.override]
    if (override) {
      provider = override
    }
  }

  if ((session.dynamic && provider.dynamic) || _state.dynamic) {
    var dynamic = Object.assign(
      {},
      _state.dynamic,
      provider.dynamic === true
        ? session.dynamic
        : Object.keys(session.dynamic || {})
            .filter((key) => provider.dynamic.includes(key))
            .reduce((all, key) => (all[key] = session.dynamic[key], all), {})
    )
    provider = init(provider, dynamic)
  }

  if (provider.state) {
    provider = dcopy(provider)
    provider.state = state(provider)
  }
  if (provider.nonce) {
    provider = dcopy(provider)
    provider.nonce = state(provider, 'nonce')
  }
  if (provider.pkce) {
    provider = dcopy(provider)
    ;({
      code_verifier: provider.code_verifier,
      code_challenge: provider.code_challenge
    } = pkce())
  }

  return provider
}

module.exports = Object.assign(ctor, {
  compose, dcopy, merge, filter, format, state, pkce, transform, init, defaults, compat, provider
})
