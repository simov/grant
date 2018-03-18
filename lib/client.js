
var compose = require('request-compose')
var Request = compose.Request
var Response = compose.Response
Request.oauth = require('request-oauth')
var qs = require('qs')


module.exports = (args) => compose(

  Request.defaults(args),

  (() =>
    args.url ? Request.url(args.url) : ({options}) => ({options})
  )(),
  (() =>
    args.qs ? Request.qs(args.qs) : ({options}) => ({options})
  )(),

  (() =>
    args.form ? Request.form(args.form) :
    args.json ? Request.json(args.json) :
    args.body ? Request.body(args.body) :
    ({options, body}) => ({options, body})
  )(),

  (() =>
    args.auth ? Request.auth(args.auth) :
    args.oauth ? Request.oauth(args.oauth) :
    ({options, body}) => ({options, body})
  )(),

  (() => ({options, body}) =>
    body ? Request.length()({options, body}) : {options}
  )(),

  Request.send(),

  Response.buffer(),
  // Response.parse(),
  // use qs instead of querystring for nested objects
  ({res, res: {headers}, body}) => {
    var header = Object.keys(headers)
      .find((name) => name.toLowerCase() === 'content-type')

    var raw = body

    if (/json|javascript/.test(headers[header])) {
      try {
        body = JSON.parse(body)
      }
      catch (err) {}
    }

    if (/application\/x-www-form-urlencoded/.test(headers[header])) {
      try {
        body = qs.parse(body)
      }
      catch (err) {}
    }

    // log({json: body})

    return {res, body, raw}
  },
  Response.status(),

)()
