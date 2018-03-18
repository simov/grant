
exports.express = () => {
  return require('./lib/consumer/express')
}

exports.koa = () => {
  var version = parseInt(require('koa/package.json').version.split('.')[0])
  return require('./lib/consumer/koa' + (version < 2 ? '' : '2'))
}

exports.hapi = () => {
  var version = parseInt(require('hapi/package.json').version.split('.')[0])
  return require('./lib/consumer/hapi' + (version < 17 ? '' : '17'))
}
