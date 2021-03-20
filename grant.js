
function grant ({handler, ...rest}) {
  if (handler === 'express') {
    return require('./lib/handler/express-4')(rest)
  }
  else if (handler === 'koa') {
    try {
      var pkg = require('koa/package.json')
    }
    catch (err) {}
    var version = pkg ? parseInt(pkg.version.split('.')[0]) : 2
    return version >= 2
      ? require('./lib/handler/koa-2')(rest)
      : require('./lib/handler/koa-1')(rest)
  }
  else if (handler === 'hapi') {
    try {
      var pkg = require('@hapi/hapi/package.json')
    }
    catch (err) {
      try {
        var pkg = require('hapi/package.json')
      }
      catch (err) {}
    }
    var version = pkg ? parseInt(pkg.version.split('.')[0]) : 17
    return version >= 17
      ? require('./lib/handler/hapi-17')(rest)
      : require('./lib/handler/hapi-16')(rest)
  }
  else if (handler === 'express-4') {
    return require('./lib/handler/express-4')(rest)
  }
  else if (handler === 'koa-2') {
    return require('./lib/handler/koa-2')(rest)
  }
  else if (handler === 'koa-1') {
    return require('./lib/handler/koa-1')(rest)
  }
  else if (handler === 'hapi-17') {
    return require('./lib/handler/hapi-17')(rest)
  }
  else if (handler === 'hapi-16') {
    return require('./lib/handler/hapi-16')(rest)
  }
  else if (handler === 'fastify') {
    return require('./lib/handler/fastify')(rest)
  }
  else if (handler === 'curveball') {
    return require('./lib/handler/curveball')(rest)
  }
  else if (handler === 'node') {
    return require('./lib/handler/node')(rest)
  }
  else if (handler === 'aws') {
    return require('./lib/handler/aws')(rest)
  }
  else if (handler === 'azure') {
    return require('./lib/handler/azure')(rest)
  }
  else if (handler === 'gcloud') {
    return require('./lib/handler/gcloud')(rest)
  }
  else if (handler === 'vercel') {
    return require('./lib/handler/vercel')(rest)
  }
}

grant.express = (options) => {
  var handler = require('./lib/handler/express-4')
  return options ? handler(options) : handler
}

grant.koa = (options) => {
  try {
    var pkg = require('koa/package.json')
  }
  catch (err) {}
  var version = pkg ? parseInt(pkg.version.split('.')[0]) : 2
  var handler = version >= 2
    ? require('./lib/handler/koa-2')
    : require('./lib/handler/koa-1')
  return options ? handler(options) : handler
}

grant.hapi = (options) => {
  try {
    var pkg = require('@hapi/hapi/package.json')
  }
  catch (err) {
    try {
      var pkg = require('hapi/package.json')
    }
    catch (err) {}
  }
  var version = pkg ? parseInt(pkg.version.split('.')[0]) : 17
  var handler = version >= 17
    ? require('./lib/handler/hapi-17')
    : require('./lib/handler/hapi-16')
  return options ? handler(options) : handler
}

grant.fastify = (options) => {
  var handler = require('./lib/handler/fastify')
  return options ? handler(options) : handler
}

grant.curveball = (options) => {
  var handler = require('./lib/handler/curveball')
  return options ? handler(options) : handler
}

grant.node = (options) => {
  var handler = require('./lib/handler/node')
  return options ? handler(options) : handler
}

grant.aws = (options) => {
  var handler = require('./lib/handler/aws')
  return options ? handler(options) : handler
}

grant.azure = (options) => {
  var handler = require('./lib/handler/azure')
  return options ? handler(options) : handler
}

grant.gcloud = (options) => {
  var handler = require('./lib/handler/gcloud')
  return options ? handler(options) : handler
}

grant.vercel = (options) => {
  var handler = require('./lib/handler/vercel')
  return options ? handler(options) : handler
}

grant.default = grant
module.exports = grant
