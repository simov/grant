
exports.express = function () {
  return require('./lib/consumer/express')
}

exports.koa = function () {
  return require('./lib/consumer/koa')
}

exports.hapi = function () {
  return require('./lib/consumer/hapi')
}
