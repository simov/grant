
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

    it('json', (done) => {
      request({url: 'http://localhost:5000/json'})
        .then(({body}) => {
          t.deepStrictEqual(body, {json: true})
          done()
        })
    })

    it('querystring', (done) => {
      request({url: 'http://localhost:5000/qs'})
        .then(({body}) => {
          t.deepStrictEqual(body, {nested: {querystring: 'true'}})
          done()
        })
    })

    it('json as text', (done) => {
      request({url: 'http://localhost:5000/jsontext'})
        .then(({body}) => {
          t.deepStrictEqual(body, {json: true})
          done()
        })
    })

    it('querystring as text', (done) => {
      request({url: 'http://localhost:5000/qstext'})
        .then(({body}) => {
          t.deepStrictEqual(body, {nested: {querystring: 'true'}})
          done()
        })
    })

    after((done) => {
      server.close(done)
    })
  })
})
