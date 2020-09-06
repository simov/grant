
var Hapi = require('@hapi/hapi')
var yar = require('@hapi/yar')
var qs = require('qs')
var grant = require('../../').hapi()


var server = new Hapi.Server({host: 'localhost', port: 3000})

server.route({method: 'GET', path: '/hello', handler: (req, res) => {
  return res
    .response(JSON.stringify(qs.parse(req.query), null, 2))
    .header('content-type', 'text/plain')
}})
server.route({method: 'GET', path: '/hi', handler: (req, res) => {
  return res
    .response(JSON.stringify(qs.parse(req.query), null, 2))
    .header('content-type', 'text/plain')
}})

;(async () => {
  await server.register([
    {plugin: yar, options: {
      name: 'grant',
      cookieOptions: {password: '01234567890123456789012345678901', isSecure: false}}},
    {plugin: grant(require('./config.json'))}
  ])
  await server.start()
})()
