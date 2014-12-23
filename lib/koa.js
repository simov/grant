
var path = require('path')

var koa = require('koa'),
  router = require('koa-router'),
  mount = require('koa-mount'),
  bodyParser = require('koa-bodyparser'),
  session = require('koa-session'),
  favicon = require('koa-favicon')

var request = require('request'),
  qs = require('qs'),
  thunkify = require('thunkify')

var config = require('./config')
var flows = {
  1: require('./oauth1'),
  2: require('./oauth2'),
  getpocket: require('./getpocket')
}
flows[1].step1 = thunkify(flows[1].step1)
flows[1].step3 = thunkify(flows[1].step3)
flows[2].step2 = thunkify(flows[2].step2)
flows.getpocket.step1 = thunkify(flows.getpocket.step1)
flows.getpocket.step3 = thunkify(flows.getpocket.step3)


function Grant (_config) {
  var app = koa()
  app.keys = ['secret','key']
  app.use(favicon(path.resolve(__dirname, '/favicon.ico')))
  app.use(bodyParser())
  app.use(session(app))
  app.use(router(app))

  app.config = config.init(_config)

  app.get('/connect/:provider/:override?', function *(next) {
    if (this.params.override == 'callback') return yield callback

    this.session.grant = {
      provider:this.params.provider,
      override:this.params.override
    }

    yield connect
  })

  app.post('/connect/:provider/:override?', function *(next) {
    this.session.grant = {
      provider:this.params.provider,
      override:this.params.override,
      dynamic:this.body
    }

    yield connect
  })

  function p (_config, session) {
    var provider = _config[session.provider]
    if (session.override && provider.overrides) {
      var override = provider.overrides[session.override]
      if (override) provider = override
    }
    if (session.dynamic) {
      provider = config.dynamic(provider, session.dynamic)
    }
    return provider
  }

  function* connect () {
    var grant = this.session.grant
    var provider = p(app.config, grant)
    var flow = flows[provider.oauth]
    

    if (provider.oauth == 1) {
      var data
      try {
        data = yield flow.step1(provider)
      } catch (err) {
        this.response.redirect(provider.callback + '?' + err)
      }
      grant.step1 = data
      var url = flow.step2(provider, data)
      this.response.redirect(url)
    }

    else if (provider.oauth == 2) {
      var url = flow.step1(provider)
      this.response.redirect(url)
    }

    else if (provider.custom) {
      flow = flows[provider.name]
      try {
        var data = yield flow.step1(provider)
      } catch (err) {
        this.response.redirect(provider.callback + '?' + err)
      }
      grant.step1 = data
      var url = flow.step2(provider, data)
      this.response.redirect(url)
    }
  }

  function* callback () {
    var grant = this.session.grant
    var provider = p(app.config, grant)
    var flow = flows[provider.oauth]

    if (provider.oauth == 1) {
      var url
      try {
        url = yield flow.step3(provider, grant.step1, this.query)
      } catch (err) {
        this.response.redirect(provider.callback + '?' + err)
      }
      this.response.redirect(url)
    }

    else if (provider.oauth == 2) {
      var data
      try {
        data = yield flow.step2(provider, this.query)
      } catch (err) {
        this.response.redirect(provider.callback + '?' + err)
      }
      var url = flow.step3(provider, data)
      this.response.redirect(url)
    }

    else if (provider.custom) {
      flow = flows[provider.name]
      try {
        var url = yield flow.step3(provider, grant.step1)
      } catch (err) {
        this.reponse.redirect(provider.callback + '?' + err)
      }
      this.response.redirect(url)
    }
  }

  return app
}

exports = module.exports = Grant
