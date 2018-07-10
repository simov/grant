
var t = require('assert')
var http = require('http')
var qs = require('qs')
var request = require('../lib/client')


describe('client', () => {
  describe('parse', () => {
    var server

    before((done) => {
      server = http.createServer()
      server.on('request', (req, res) => {
        if (req.url === '/json') {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end(JSON.stringify({json: true}))
        }
        if (req.url === '/qs') {
          res.writeHead(200, {'content-type': 'application/x-www-form-urlencoded'})
          res.end(qs.stringify({nested: {querystring: true}}))
        }
        if (req.url === '/jsontext') {
          res.writeHead(200, {'content-type': 'text/plain'})
          res.end(JSON.stringify({json: true}))
        }
        if (req.url === '/qstext') {
          res.writeHead(200, {'content-type': 'text/html'})
          res.end(qs.stringify({nested: {querystring: true}}))
        }
      })
      server.listen(5000, done)
    })

    it('json', async () => {
      var {body} = await request({url: 'http://localhost:5000/json'})
      t.deepStrictEqual(body, {json: true})
    })

    it('querystring', async () => {
      var {body} = await request({url: 'http://localhost:5000/qs'})
      t.deepStrictEqual(body, {nested: {querystring: 'true'}})
    })

    it('json as text', async () => {
      var {body} = await request({url: 'http://localhost:5000/jsontext'})
      t.deepStrictEqual(body, {json: true})
    })

    it('querystring as text', async () => {
      var {body} = await request({url: 'http://localhost:5000/qstext'})
      t.deepStrictEqual(body, {nested: {querystring: 'true'}})
    })

    after((done) => {
      server.close(done)
    })
  })
})
