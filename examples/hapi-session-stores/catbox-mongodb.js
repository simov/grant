
var Hapi = require('hapi')
var yar = require('yar')
var store = require('catbox-mongodb')
var grant = require('grant-hapi')


var server = new Hapi.Server({cache: {engine: store}})
server.connection({host: 'localhost', port: 3000})

server.route({method: 'GET', path: '/hello', handler: (req, res) => {
  res(JSON.stringify((req.session || req.yar).get('grant').response, null, 2))
    .header('content-type', 'text/plain')
}})
server.route({method: 'GET', path: '/hi', handler: (req, res) => {
  res(JSON.stringify((req.session || req.yar).get('grant').response, null, 2))
    .header('content-type', 'text/plain')
}})

server.register([
  {register: yar, options: {
    // The cache will be used only when the jar size goes above the default
    // which is 1K.
    // Nothing will go into the cache until you hit that 1K limit.

    // Using maxCookieSize 0 forces all session data to be written to the
    // database.
    maxCookieSize: 0,
    cache: {expiresIn: 24 * 60 * 60 * 1000},
    cookieOptions: {password: '01234567890123456789012345678912', isSecure: false}}},
  {register: grant(), options: require('./config.json')}
], (err) =>
  server.start()
)
