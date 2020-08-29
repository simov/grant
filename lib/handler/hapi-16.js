
var url = require('url')
var qs = require('qs')
var Grant = require('../grant')


module.exports = function (args = {}) {
  var app = {}

  function register (server, options, next) {
    args = args.config ? args : {config: args}
    args.config = Object.keys(options).length ? options : args.config

    var grant = Grant(args)
    app.config = grant.config

    var prefix = app.config.defaults.prefix
      .replace(server.realm.modifiers.route.prefix, '')

    server.route({
      method: ['GET', 'POST'],
      path: `${prefix}/{provider}/{override?}`,
      handler: (req, res) => {
        if (!(req.session || req.yar)) {
          throw new Error('Grant: register session plugin first')
        }

        var query = (parseInt(server.version.split('.')[0]) >= 12)
          ? qs.parse(url.parse(req.url, false).query) // #2985
          : req.query

        var body = (parseInt(server.version.split('.')[0]) >= 12)
          ? qs.parse(req.payload) // #2985
          : req.payload

        grant({
          method: req.method,
          params: req.params,
          query: query,
          body: body,
          state: req.plugins.grant,
          session: (req.session || req.yar).get('grant'),
        }).then(({location, session, state}) => {
          ;(req.session || req.yar).set('grant', session)
          req.plugins.grant = state
          location ? res.redirect(location) : res.continue()
        })
      }
    })

    next()
  }

  register.attributes = {
    pkg: require('../../package.json')
  }

  app.register = register
  return app
}
