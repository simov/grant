
var express = require('express'),
  logger = require('morgan'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  session = require('express-session')

var consolidate = require('consolidate'),
  hogan = require('hogan.js'),
  extend = require('extend'),
  Grant = require('../../index').express()

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


var grant = new Grant(transform(config))


var app = express()
app.use(logger('dev'))
app.use(grant)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser())
app.use(session({
    name: 'grant', secret: 'very secret',
    saveUninitialized: true, resave: true
  }))

app.set('port', process.env.PORT||3000)
app.set('views', __dirname)
app.set('view engine', 'html')
app.set('view cache', true)
app.engine('html', consolidate.hogan)


// evernote sandbox urls
grant.config.evernote.request_url = grant.config.evernote.request_url.replace('www','sandbox')
grant.config.evernote.authorize_url = grant.config.evernote.authorize_url.replace('www','sandbox')
grant.config.evernote.access_url = grant.config.evernote.access_url.replace('www','sandbox')
// feedly sandbox urls
grant.config.feedly.authorize_url = grant.config.feedly.authorize_url.replace('cloud','sandbox')
grant.config.feedly.access_url = grant.config.feedly.access_url.replace('cloud','sandbox')


app.get('/', function (req, res) {
  var session = req.session.grant||{}

  // feedly sandbox redirect_uri
  if (session.provider == 'feedly' && req.query.code) {
    var q = require('querystring')
    res.redirect('/connect/feedly/callback?'+q.stringify(req.query))
    return
  }

  console.log(req.query)

  var providers = Object.keys(grant.config)
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
  res.render('template', {
    providers:params,
    count:providers.length-1//linkedin2
  })
})

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'))
})
