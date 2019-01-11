
var Hapi = require('hapi')
var yar = require('yar')
var grant = require('grant-hapi')


var server = new Hapi.Server()
server.connection({host: 'localhost', port: 3000})

server.route({method: 'GET', path: '/hello', handler: (req, res) => {
  res(JSON.stringify(req.query, null, 2)).header('content-type', 'text/plain')
}})
server.route({method: 'GET', path: '/hi', handler: (req, res) => {
  res(JSON.stringify(req.query, null, 2)).header('content-type', 'text/plain')
}})

server.register([
  {register: yar, options: {cookieOptions: {password: '01234567890123456789012345678912', isSecure: false}}},
  {register: grant(), options: require('./config.json')}
], (err) =>
  server.start()
)
