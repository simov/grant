
function grant ({handler, ...rest}) {
  if (handler === 'express') {
    var version = 4
  }
  else if (handler === 'koa') {
    var version =
      parseInt(require('koa/package.json').version.split('.')[0]) >= 2 ? 2 : 1
  }
  else if (handler === 'hapi') {
    try {
      var pkg = require('@hapi/hapi/package.json')
    }
    catch (err) {
      var pkg = require('hapi/package.json')
    }
    var version = parseInt(pkg.version.split('.')[0]) >= 17 ? 17 : 16
  }
  return version
    ? require(`./lib/handler/${handler}-${version}`)(rest)
    : require(`./lib/handler/${handler}`)(rest)
}

grant.express = (options) => {
  var version = 4
  var handler = require(`./lib/handler/express-${version}`)
  return options ? handler(options) : handler
}

grant.koa = (options) => {
  var version =
    parseInt(require('koa/package.json').version.split('.')[0]) >= 2 ? 2 : 1
  var handler = require(`./lib/handler/koa-${version}`)
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
  var handler = require(`./lib/handler/hapi-${version}`)
  return options ? handler(options) : handler
}

;[
  'fastify', 'curveball',
  'node', 'aws', 'azure', 'gcloud', 'vercel'
].forEach((provider) => {
  grant[provider] = (options) => {
    var handler = require(`./lib/handler/${provider}`)
    return options ? handler(options) : handler
  }
})

grant.default = grant
module.exports = grant
