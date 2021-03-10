
function grant ({handler, ...rest}) {
  if (handler === 'express') {
    var version = 4
    return require('./lib/handler/express-4')(rest)
  }
  else if (handler === 'koa') {
    if (parseInt(require('koa/package.json').version.split('.')[0]) >= 2) {
      return require('./lib/handler/koa-2')(rest)
    }
    else {
      return require('./lib/handler/koa-1')(rest)
    }
  
  }
  else if (handler === 'hapi') {
    try {
      var pkg = require('@hapi/hapi/package.json')
    }
    catch (err) {
      var pkg = require('hapi/package.json')
    }
    var version = parseInt(pkg.version.split('.')[0]) >= 17 ? 17 : 16
    if (version >= 17) {
      return require('./lib/handler/hapi-17')(rest)
    }
    else {
      return require('./lib/handler/hapi-16')(rest)
    }

  }
}

grant.express = (options) => {
  var handler = require('./lib/handler/express-4')
  return options ? handler(options) : handler
}

grant.koa = (options) => {
  var version =
    parseInt(require('koa/package.json').version.split('.')[0]) >= 2 ? 2 : 1
  if (version >= 2) {
    var handler = require('./lib/handler/koa-2')
  }
  else {
    var handler = require('./lib/handler/koa-1')
  }
  return options ? handler(options) : handler
}

grant.hapi = (options) => {
  try {
    var pkg = require('@hapi/hapi/package.json')
  }
  catch (err) {
    var pkg = require('hapi/package.json')
  }
  var version = parseInt(pkg.version.split('.')[0]) >= 17 ? 17 : 16
  if (version >= 17) {
    var handler = require('./lib/handler/hapi-17')(rest)
  }
  else {
    var handler = require('./lib/handler/hapi-16')(rest)
  }
  return options ? handler(options) : handler
}

grant['fastify'] = (options) => {
  var handler = require('./lib/handler/fastify')
  return options ? handler(options) : handler
}
grant['curveball'] = (options) => {
  var handler = require('./lib/handler/curveball')
  return options ? handler(options) : handler
}
grant['node'] = (options) => {
  var handler = require('./lib/handler/node')
  return options ? handler(options) : handler
}
grant['aws'] = (options) => {
  var handler = require('./lib/handler/aws')
  return options ? handler(options) : handler
}
grant['azure'] = (options) => {
  var handler = require('./lib/handler/azure')
  return options ? handler(options) : handler
}
grant['gcloud'] = (options) => {
  var handler = require('./lib/handler/gcloud')
  return options ? handler(options) : handler
}
grant['vercel'] = (options) => {
  var handler = require('./lib/handler/vercel')
  return options ? handler(options) : handler
}

grant.default = grant
module.exports = grant
