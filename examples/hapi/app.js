
var Hapi = require('hapi')
var yar = require('yar')

var Grant = require('grant-hapi')
var grant = new Grant()

var server = new Hapi.Server()
server.connection({host: 'localhost', port: 3000})

server.route({method: 'GET', path: '/handle_facebook_callback', handler: (req, res) => {
  console.log(req.query)
  res(JSON.stringify(req.query, null, 2))
}})

server.route({method: 'GET', path: '/handle_twitter_callback', handler: (req, res) => {
  console.log(req.query)
  res(JSON.stringify(req.query, null, 2))
}})

server.register([
  // REQUIRED:
  {
    register: yar,
    options: {
      cookieOptions: {
        password: 'grant',
        isSecure: false
      }
    }
  },
  // mount grant
  {
    register: grant,
    options: require('./config.json')
  }
], (err) => {
  if (err) {
    throw err
  }

  server.start()
})
