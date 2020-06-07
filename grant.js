
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

  if (/^(?:express|koa|hapi)$/.test(handler)) {
    return require(`./lib/handler/${handler}-${version}`)(rest)
  }
  else {
    return require(`./lib/handler/${handler}`)(rest)
  }
}

grant.express = (options) => {
  var handler = 'express'
  var version = 4
  if (options) {
    return require(`./lib/handler/${handler}-${version}`)(options)
  }
  else {
    return require(`./lib/handler/${handler}-${version}`)
  }
}

grant.koa = (options) => {
  var handler = 'koa'
  var version =
    parseInt(require('koa/package.json').version.split('.')[0]) >= 2 ? 2 : 1
  if (options) {
    return require(`./lib/handler/${handler}-${version}`)(options)
  }
  else {
    return require(`./lib/handler/${handler}-${version}`)
  }
}

grant.hapi = (options) => {
  var handler = 'hapi'
  try {
    var pkg = require('@hapi/hapi/package.json')
  }
  catch (err) {
    var pkg = require('hapi/package.json')
  }
  var version = parseInt(pkg.version.split('.')[0]) >= 17 ? 17 : 16
  if (options) {
    return require(`./lib/handler/${handler}-${version}`)(options)
  }
  else {
    return require(`./lib/handler/${handler}-${version}`)
  }
}

module.exports = grant
