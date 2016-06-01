'use strict'

var qs = require('qs')

var config = require('../config')
var flows = {
  1: require('../flow/oauth1'),
  2: require('../flow/oauth2'),
  getpocket: require('../flow/getpocket')
}


function Grant () {
  this.register.attributes = {
    pkg: require('../../package.json')
  }
}

Grant.prototype.register = function (server, options, next) {
  var self = this
  self.config = config.init(options)
  this.register.config = self.config
  this.register._config = config
  Grant.config = self.config
  Grant._config = config

  server.route({
    method: ['GET', 'POST'],
    path: '/connect/{provider}/{override?}',
    handler: function (req, res) {
      if (!(req.session || req.yar)) {
        throw new Error('Grant: register session plugin first')
      }

      var session = {
        provider: req.params.provider
      }
      if (req.params.override) {
        session.override = req.params.override
      }
      if (req.method === 'get' && Object.keys(req.query || {}).length) {
        session.dynamic = req.query
      }
      if (req.method === 'post' && Object.keys(req.payload || {}).length) {
        session.dynamic = req.payload
      }
      ;(req.session || req.yar).set('grant', session)

      connect(req, res)
    }
  })

  function connect (req, res) {
    var grant = (req.session || req.yar).get('grant')
    var provider = config.provider(self.config, grant)
    var flow = flows[provider.oauth]

    function callback (err, url) {
      var path = (provider.callback || '')
      if (err) {
        path ? res.redirect(path + '?' + err) : res(err)
      }
      else {
        res.redirect(url)
      }
    }

    if (/^1$/.test(provider.oauth)) {
      flow.step1(provider, function (err, data) {
        if (err) {
          callback(err)
        }
        else {
          grant.step1 = data
          var url = flow.step2(provider, data)
          var error = !/^http|\//.test(url) ? url : null
          callback(error, url)
        }
      })
    }

    else if (/^2$/.test(provider.oauth)) {
      grant.state = provider.state
      var url = flow.step1(provider)
      callback(null, url)
    }

    else if (flow) {
      flow.step1(provider, function (err, data) {
        if (err) {
          callback(err)
        }
        else {
          grant.step1 = data
          var url = flow.step2(provider, data)
          callback(null, url)
        }
      })
    }

    else {
      var err = {error: 'Grant: missing or misconfigured provider'}
      callback(qs.stringify(err))
    }
  }

  server.route({
    method: 'GET',
    path: '/connect/{provider}/callback',
    handler: function (req, res) {
      var grant = (req.session || req.yar).get('grant') || {}
      var provider = config.provider(self.config, grant)
      var flow = flows[provider.oauth]

      function callback (err, response) {
        var path = (provider.callback || '')
        if (err) {
          path ? res.redirect(path + '?' + err) : res(err)
        }
        else if (!provider.transport || provider.transport === 'querystring') {
          res.redirect(path + '?' + response)
        }
        else if (provider.transport === 'session') {
          grant.response = qs.parse(response)
          ;(req.session || req.yar).set('grant', grant)
          res.redirect(path)
        }
      }

      if (/^1$/.test(provider.oauth)) {
        flow.step3(provider, grant.step1, req.query, callback)
      }

      else if (/^2$/.test(provider.oauth)) {
        flow.step2(provider, req.query, grant, function (err, data) {
          if (err) {
            callback(err)
          }
          else {
            var response = flow.step3(provider, data)
            callback(null, response)
          }
        })
      }

      else if (flow) {
        flow.step3(provider, grant.step1, callback)
      }

      else {
        var err = {error: 'Grant: missing session or misconfigured provider'}
        callback(qs.stringify(err))
      }
    }
  })

  next()
}

exports = module.exports = Grant
