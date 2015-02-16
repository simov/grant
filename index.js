
exports = module.exports = require('./lib/express')

exports.express = function () {
  return require('./lib/express')
}

exports.koa = function () {
  return require('./lib/koa')
}

exports.hapi = function () {
  return require('./lib/hapi')
}
