
var Hapi = require('hapi')
  , yar = require('yar')
  , hogan = require('hapi-hogan')

var extend = require('extend')
  , Grant = require('../../index').hapi()

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


var server = new Hapi.Server()
server.connection({host: 'localhost', port: 3000})

server.views({
  relativeTo:__dirname,
  path:'./',
  engines: {
    html:{
      module: hogan
    }
  }
})

server.route({method: 'GET', path: '/', handler: function (req, res) {
  var session = req.session.get('grant') || {}

  // feedly sandbox redirect_uri
  if (session.provider == 'feedly' && req.query.code) {
    var q = require('querystring')
    res.redirect('/connect/feedly/callback?'+q.stringify(req.query))
    return
  }

  console.log(req.query)

  var providers = Object.keys(grant.register.config)
  var params = []

  providers.forEach(function (provider) {
    var obj = {url:'/connect/'+provider, name:provider}
    if (session.provider == provider) {
      obj.credentials = req.query
      var key = req.query.error ? 'error' : 'raw'
      obj.credentials[key] = JSON.stringify(req.query[key], null, 4)
    }
    params.push(obj)
  })

  res.view('template', {
    consumer:'Hapi',
    providers:params,
    count:providers.length-1//linkedin2
  })
}})

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
  if (err) throw err

  // evernote sandbox urls
  grant.register.config.evernote.request_url = grant.register.config.evernote.request_url.replace('www','sandbox')
  grant.register.config.evernote.authorize_url = grant.register.config.evernote.authorize_url.replace('www','sandbox')
  grant.register.config.evernote.access_url = grant.register.config.evernote.access_url.replace('www','sandbox')
  // feedly sandbox urls
  grant.register.config.feedly.authorize_url = grant.register.config.feedly.authorize_url.replace('cloud','sandbox')
  grant.register.config.feedly.access_url = grant.register.config.feedly.access_url.replace('cloud','sandbox')

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
