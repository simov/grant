
var Hapi = require('hapi')
  , yar = require('yar')

var Grant = require('grant-hapi')
  , grant = new Grant()

var server = new Hapi.Server()
server.connection({host: 'localhost', port: 3000})

server.route({method: 'GET', path: '/handle_facebook_callback', handler: function (req, res) {
  console.log(req.query)
  res(JSON.stringify(req.query, null, 2))
}})

server.route({method: 'GET', path: '/handle_twitter_callback', handler: function (req, res) {
  console.log(req.query)
  res(JSON.stringify(req.query, null, 2))
}})

server.register([{
  register: grant,
  options: require('./config.json')
}, {
  register: yar,
  options: {
    cookieOptions: {
      password: 'password',
      isSecure: false
    }
  }
}], function (err) {
  if (err) throw err

  server.start()
})
