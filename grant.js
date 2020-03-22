
function grant ({handler, config}) {
  var version = () => ({
    express: 4,
    koa: parseInt(require('koa/package.json').version.split('.')[0]) < 2 ? '1' : '2',
    hapi: (() => {
      try {
        return parseInt(require('@hapi/hapi/package.json').version.split('.')[0])
      }
      catch (err) {
        return parseInt(require('hapi/package.json').version.split('.')[0])
      }
    })() < 17 ? '16' : '17'
  }[handler])

  if (/express|koa|hapi/.test(handler) && !/-\d+$/.test(handler)) {
    return require(`./lib/consumer/${handler}-${version()}`)(config)
  }
  else {
    return require(`./lib/consumer/${handler}`)(config)
  }
}

grant.express = () => {
  return require('./lib/consumer/express-4')
}

grant.koa = () => {
  var version = parseInt(require('koa/package.json').version.split('.')[0])
  return require('./lib/consumer/koa-' + (version < 2 ? '1' : '2'))
}

grant.hapi = () => {
  var pkg
  try {
    pkg = require('hapi/package.json')
  }
  catch (err) {
    pkg = require('@hapi/hapi/package.json')
  }
  var version = parseInt(pkg.version.split('.')[0])
  return require('./lib/consumer/hapi-' + (version < 17 ? '16' : '17'))
}

module.exports = grant
