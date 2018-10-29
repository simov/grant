
var Hapi = require('hapi')
var yar = require('yar')
var grant = require('grant-hapi')

var config = require('./config.json')


var server = new Hapi.Server({host: 'localhost', port: 3000})

server.route({method: 'GET', path: '/facebook_callback', handler: (req, res) => {
  return res.response(JSON.stringify(req.query, null, 2)).header('content-type', 'text/plain')
}})
server.route({method: 'GET', path: '/twitter_callback', handler: (req, res) => {
  return res.response(JSON.stringify(req.query, null, 2)).header('content-type', 'text/plain')
}})

server.register([
  {plugin: yar, options: {cookieOptions: {password: '01234567890123456789012345678912', isSecure: false}}},
  {plugin: grant(), options: config}
])
  .then(() => server.start().then(() => console.log(`Hapi server listening on port ${3000}`)))
