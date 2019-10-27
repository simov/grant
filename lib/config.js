
var crypto = require('crypto')

var oauth = require('../config/oauth.json')
var reserved = require('../config/reserved.json')


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
    reserved.includes(key) ||
    // custom parameter
    (obj.custom_parameters && obj.custom_parameters.includes(key)) ||
    // static override
    typeof obj[key] === 'object'
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

  redirect_uri: ({redirect_uri, protocol, host, path = '', name}) =>
      redirect_uri
    ? redirect_uri

    : protocol && host && name
    ? `${protocol}://${host}${path}/connect/${name}/callback`

    : undefined
  ,

  custom_params: (provider) => {

    var keys = (provider.custom_parameters || [])
      .filter((key) =>
        !reserved.includes(key) &&
        key !== provider.name &&
        typeof provider[key] !== 'object'
      )

    // extract
    var direct = keys.reduce((all, key) => (all[key] = provider[key], all), {})
    // merge
    var params = Object.assign(direct, provider.custom_params || {})
    // remove
    keys.forEach((key) => delete provider[key])

    // remove falsy
    params = Object.keys(params)
      .filter((key) => params[key])
      .reduce((all, key) => (all[key] = params[key], all), {})

    return Object.keys(params).length ? params : undefined
  },

  overrides: (provider) => {

    var keys = Object.keys(provider)
      .filter((key) =>
        !reserved.includes(key) &&
        key !== provider.name &&
        typeof provider[key] === 'object'
      )

    // extract
    var direct = keys.reduce((all, key) => (all[key] = provider[key], all), {})
    // merge
    var overrides = Object.assign(direct, provider.overrides || {})
    // remove
    keys.forEach((key) => delete provider[key])
    delete provider.overrides

    // remove nested
    Object.keys(overrides).forEach((key) => {
      overrides[key] = Object.keys(overrides[key])
        .filter((nested) => reserved.includes(nested) && nested !== 'overrides')
        .reduce((all, nested) => (all[nested] = overrides[key][nested], all), {})
    })

    overrides = Object.keys(overrides)
      .reduce((all, key) => (all[key] = init(provider, overrides[key]), all), {})

    return Object.keys(overrides).length ? overrides : undefined
  },

}

var state = (provider, key = 'state', value = provider[key]) =>
    /string|number/.test(typeof value)
  ? value.toString()

  : value === true
  ? crypto.randomBytes(10).toString('hex')

  : undefined

var transform = (provider) => {

  Object.keys(format)
    .forEach((key) => provider[key] = format[key](provider))

  // filter undefined
  return dcopy(provider)
}

var init = compose(merge, filter, transform)

var compat = (config) =>
  config.fitbit2 ? (
    Object.assign({}, config, {fitbit2: Object.assign({}, oauth.fitbit, config.fitbit2)})
  ) : config

// init all configured providers
var ctor = (config = {}, defaults = config.defaults || config.server) =>
  Object.keys(compat(config))
    .filter((name) => !/defaults|server/.test(name))
    .reduce((all, name) => (
      all[name] = init(oauth[name], defaults, config[name], {name, [name]: true}),
      all
    ), defaults ? {defaults} : {})

// get provider on connect
var provider = (config, session) => {
  var name = session.provider
  var provider = config[name]

  if (!provider) {
    if ((config.defaults || {}).dynamic !== true) {
      return {}
    }
    provider = init(oauth[name], config.defaults, {name, [name]: true})
  }

  if (session.override && provider.overrides) {
    var override = provider.overrides[session.override]
    if (override) {
      provider = override
    }
  }

  if (session.dynamic && provider.dynamic) {
    var dynamic = provider.dynamic === true ? session.dynamic :
      Object.keys(session.dynamic)
        .filter((key) => provider.dynamic.includes(key))
        .reduce((all, key) => (all[key] = session.dynamic[key], all), {})
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

  return provider
}

module.exports = Object.assign(ctor, {
  compose, dcopy, merge, filter, format, state, transform, init, compat, provider
})
