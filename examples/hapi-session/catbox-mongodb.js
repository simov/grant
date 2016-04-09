
var Hapi = require('hapi')
var yar = require('yar')

var Grant = require('grant-hapi')
var grant = new Grant()

var server = new Hapi.Server({
  cache: {
    engine: require('catbox-mongodb')
  }
})
server.connection({host: 'localhost', port: 3000})

server.route({method: 'GET', path: '/handle_facebook_callback', handler: function (req, res) {
  var response = (req.session || req.yar).get('grant').response
  console.log(response)
  res(JSON.stringify(response, null, 2))
}})

server.route({method: 'GET', path: '/handle_twitter_callback', handler: function (req, res) {
  var response = (req.session || req.yar).get('grant').response
  console.log(response)
  res(JSON.stringify(response, null, 2))
}})

server.register([
  // REQUIRED:
  {
    register: yar,
    options: {
      // The cache will be used only when the jar size goes above the default
      // which is 1K.
      // Nothing will go into the cache until you hit that 1K limit.

      // Using maxCookieSize 0 forces all session data to be written to the
      // database.
      maxCookieSize: 0,
      cache: {
        expiresIn: 24 * 60 * 60 * 1000
      },
      cookieOptions: {
        password: 'abcdefghigklmnopqrstuvwxyz123456', // min 32 chars
        isSecure: false
      }
    }
  },
  // mount grant
  {
    register: grant,
    options: require('./config.json')
  }
], function (err) {
  if (err) {
    throw err
  }

  server.start()
})
