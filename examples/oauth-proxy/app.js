
var qs = require('querystring')
var express = require('express')


express()
  .use('/login/:provider', (req, res) => {
    var provider = req.params.provider
    var params = qs.stringify({
      transport: 'querystring',
      callback: `http://localhost:${3000}/hello`,
      // pass any other option here
    })
    res.redirect(`https://grant.outofindex.com/connect/${provider}?${params}`)
  })
  .get('/hello', (req, res) => {
    res.end(JSON.stringify(req.query, null, 2))
  })
  .listen(3000)
