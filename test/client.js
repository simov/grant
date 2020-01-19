
var t = require('assert')
var http = require('http')
var qs = require('qs')
var compose = require('request-compose')
var request = require('../lib/client')


describe('client', () => {
  describe('defaults', () => {
    var server

    before((done) => {
      server = http.createServer()
      server.on('request', (req, res) => {
        t.ok(/^simov\/grant/.test(req.headers['user-agent']))
        res.end()
      })
      server.listen(5000, done)
    })

    after((done) => {
      server.close(done)
    })

    it('user-agent', async () => {
      var {res} = await request({url: 'http://localhost:5000'})
      t.equal(res.statusCode, 200)
    })
  })
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

    after((done) => {
      server.close(done)
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

    it('extend', async () => {
      var {body} = await request({url: 'http://localhost:5000/qstext'})
      t.deepStrictEqual(body, {nested: {querystring: 'true'}})
      var {body} = await compose.client({url: 'http://localhost:5000/qstext'})
      t.equal(body, 'nested%5Bquerystring%5D=true')
    })
  })
})
