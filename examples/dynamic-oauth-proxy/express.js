
var express = require('express')
var qs = require('querystring')


express()
  .use('/login/:provider', (req, res) => {
    var provider = req.params.provider
    var params = qs.stringify({
      transport: 'querystring',
      response: 'tokens',
      callback: 'http://localhost:3000/hello',
      // pass any other configuration here
    })
    res.redirect(`https://grant.outofindex.com/connect/${provider}?${params}`)
  })
  .get('/hello', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })
  .listen(3000)
