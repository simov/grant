
exports.express = function () {
  return require('./lib/consumer/express')
}

exports.koa = function () {
  var version = parseInt(require('koa/package.json').version.split('.')[0])
  return require('./lib/consumer/koa' + (version < 2 ? '' : '2'))
}

exports.hapi = function () {
  return require('./lib/consumer/hapi')
}
