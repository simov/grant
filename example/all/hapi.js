
var Hapi = require('hapi')
  , yar = require('yar')

var extend = require('extend'),
  Grant = require('../../index').hapi()

var config = {
  server: require('./config/server.json'),
  credentials: require('./config/credentials.json'),
  options: require('./config/options.json')
}

function transform (config) {
  var result = {server: config.server}
  for (var key in config.credentials) {
    var provider = {}
    extend(true, provider, config.credentials[key], config.options[key])
    result[key] = provider
  }
  return result
}


var grant = new Grant()


// Create a server with a host and port
var server = new Hapi.Server()
server.connection({ 
    host: 'localhost', 
    port: 3000 
})

// Add the route
server.route({
  method: 'GET',
  path: '/', 
  handler: function (req, res) {
    res(JSON.stringify(req.query, null, 2))
  }
})

// Start the server
server.register([{
  register: grant,
  options: transform(config)
}, {
  register: yar,
  options: {
    cookieOptions: {
      password: 'password',
      isSecure: false
    }
  }
}], function (err) {
  if (err) {
    throw err
  }

  server.start(function () {
    server.log('info', 'Server running at: ' + server.info.uri)
  })
})

server.on('log', function (e) {
  console.log(e)
})

server.on('error', function (e) {
  console.log(e)
})
