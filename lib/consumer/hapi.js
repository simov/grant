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
    method:['GET', 'POST'],
    path:'/connect/{provider}/{override?}',
    handler: function (req, res) {
      if (!(req.session||req.yar)) throw new Error('Grant: register session plugin first')

      var session = {
        provider:req.params.provider
      }
      if (req.params.override) {
        session.override = req.params.override
      }
      if (req.method == 'get' && Object.keys(req.query||{}).length) {
        session.dynamic = req.query
      }
      if (req.method == 'post' && Object.keys(req.payload||{}).length) {
        session.dynamic = req.payload
      }
      ;(req.session||req.yar).set('grant', session)

      connect(req, res)
    }
  })

  function connect (req, res) {
    var grant = (req.session||req.yar).get('grant')
    var provider = config.provider(self.config, grant)
    var flow = flows[provider.oauth]

    if (provider.oauth == 1) {
      flow.step1(provider, function (err, data) {
        if (err) return res.redirect(provider.callback + '?' + err)
        grant.step1 = data
        var url = flow.step2(provider, data)
        res.redirect(url)
      })
    }

    else if (provider.oauth == 2) {
      grant.state = provider.state
      var url = flow.step1(provider)
      res.redirect(url)
    }

    else if (flow) {
      flow.step1(provider, function (err, data) {
        if (err) return res.redirect(provider.callback + '?' + err)
        grant.step1 = data
        var url = flow.step2(provider, data)
        res.redirect(url)
      })
    }

    else {
      var err = {error:'Grant: missing or misconfigured provider'}
      if (provider.callback) {
        res.redirect(provider.callback + '?' + qs.stringify(err))
      } else {
        res(JSON.stringify(err))
      }
    }
  }

  server.route({
    method:'GET',
    path:'/connect/{provider}/callback',
    handler: function (req, res) {
      var grant = (req.session||req.yar).get('grant') || {}
      var provider = config.provider(self.config, grant)
      var flow = flows[provider.oauth]

      function callback (response) {
        if (!provider.transport || provider.transport == 'querystring') {
          res.redirect(provider.callback + '?' + response)
        }
        else if (provider.transport == 'session') {
          grant.response = qs.parse(response)
          ;(req.session||req.yar).set('grant', grant)
          res.redirect(provider.callback)
        }
      }

      if (provider.oauth == 1) {
        flow.step3(provider, grant.step1, req.query, function (err, response) {
          if (err) return res.redirect(provider.callback + '?' + err)
          callback(response)
        })
      }

      else if (provider.oauth == 2) {
        flow.step2(provider, req.query, grant, function (err, data) {
          if (err) return res.redirect(provider.callback + '?' + err)
          var response = flow.step3(provider, data)
          callback(response)
        })
      }

      else if (flow) {
        flow.step3(provider, grant.step1, function (err, response) {
          if (err) return res.redirect(provider.callback + '?' + err)
          callback(response)
        })
      }

      else {
        var err = {error:'Grant: missing session or misconfigured provider'}
        if (provider.callback) {
          res.redirect(provider.callback + '?' + qs.stringify(err))
        } else {
          res(JSON.stringify(err))
        }
      }
    }
  })

  next()
}

exports = module.exports = Grant
