
var qs = require('qs')
var compose = require('request-compose')

var Request = compose.Request
var Response = compose.Response

Request.oauth = require('request-oauth')

Response.parse = () => ({options, res, res: {headers}, body, raw}) => {

  raw = body

  var header = Object.keys(headers)
    .find((name) => name.toLowerCase() === 'content-type')

  if (/json|javascript/.test(headers[header])) {
    try {
      body = JSON.parse(body)
    }
    catch (err) {}
  }

  else if (/application\/x-www-form-urlencoded/.test(headers[header])) {
    try {
      // use qs instead of querystring for nested objects
      body = qs.parse(body)
    }
    catch (err) {}
  }

  // some providers return wrong `content-type` like: text/html or text/plain
  else {
    try {
      body = JSON.parse(body)
    }
    catch (err) {
      // use qs instead of querystring for nested objects
      body = qs.parse(body)
    }
  }

  // log({json: body})

  return {options, res, body, raw}
}

module.exports = compose.client
