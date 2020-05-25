
var Hapi = require('@hapi/hapi')
var yar = require('@hapi/yar')
var grant = require('../../').hapi()


var server = new Hapi.Server({host: 'localhost', port: 3000})

server.ext('onPostHandler', (req, res) => {
  if (/^\/connect\/.*?\/callback$/.test(req.path)) {
    return res
      .response(JSON.stringify(req.plugins.grant.response, null, 2))
      .header('content-type', 'text/plain')
  }
  return res.continue
})

;(async () => {
  await server.register([
    {plugin: yar, options: {
      name: 'grant',
      cookieOptions: {password: '01234567890123456789012345678901', isSecure: false}}},
    {plugin: grant(require('./config.json'))}
  ])
  await server.start()
})()
