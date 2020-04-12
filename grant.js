
function grant ({handler, ...rest}) {
  var version = () => ({
    express: 4,
    koa: parseInt(require('koa/package.json').version.split('.')[0]) >= 2 ? 2 : 1,
    hapi: (() => {
      var pkg
      try {
        pkg = require('@hapi/hapi/package.json')
      }
      catch (err) {
        pkg = require('hapi/package.json')
      }
      return parseInt(pkg.version.split('.')[0])
    })() >= 17 ? 17 : 16
  }[handler])

  if (/express|koa|hapi/.test(handler) && !/-\d+$/.test(handler)) {
    return require(`./lib/handler/${handler}-${version()}`)(rest)
  }
  else {
    return require(`./lib/handler/${handler}`)(rest)
  }
}

grant.express = () => {
  var version = 4
  return require(`./lib/handler/express-${version}`)
}

grant.koa = () => {
  var version = parseInt(require('koa/package.json').version.split('.')[0])
  return require('./lib/handler/koa-' + (version >= 2 ? 2 : 1))
}

grant.hapi = () => {
  var pkg
  try {
    pkg = require('@hapi/hapi/package.json')
  }
  catch (err) {
    pkg = require('hapi/package.json')
  }
  var version = parseInt(pkg.version.split('.')[0])
  return require('./lib/handler/hapi-' + (version >= 17 ? 17 : 16))
}

module.exports = grant
