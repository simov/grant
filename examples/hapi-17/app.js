
var Hapi = require('hapi')
var yar = require('yar')
var grant = require('grant-hapi')


var server = new Hapi.Server({host: 'localhost', port: 3000})

server.route({method: 'GET', path: '/hello', handler: (req, res) => {
  return res.response(JSON.stringify(req.query, null, 2)).header('content-type', 'text/plain')
}})
server.route({method: 'GET', path: '/hi', handler: (req, res) => {
  return res.response(JSON.stringify(req.query, null, 2)).header('content-type', 'text/plain')
}})

server.register([
  {plugin: yar, options: {cookieOptions: {password: '01234567890123456789012345678912', isSecure: false}}},
  {plugin: grant(), options: require('./config.json')}
])
  .then(() => server.start())
