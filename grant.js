
function grant ({config, handler}) {
  return require(`./lib/consumer/${handler}`)(config)
}

// DEPRECATED

grant.express = () => {
  return require('./lib/consumer/express')
}

grant.koa = () => {
  var version = parseInt(require('koa/package.json').version.split('.')[0])
  return require('./lib/consumer/koa' + (version < 2 ? '' : '2'))
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
  return require('./lib/consumer/hapi' + (version < 17 ? '' : '17'))
}

module.exports = grant
