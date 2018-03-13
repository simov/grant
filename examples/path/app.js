
var express = require('express')
var logger = require('morgan')
var session = require('express-session')

var Grant = require('grant-express')
var grant = new Grant(require('./config.json'))

var app = express()
app.use(logger('dev'))
// REQUIRED:
app.use(session({secret: 'very secret'}))
// mount grant
app.use('/path/prefix', grant)

app.get('/handle_twitter_callback', (req, res) => {
  console.log(req.query)
  res.end(JSON.stringify(req.query, null, 2))
})

app.listen(3000, () => {
  console.log('Express server listening on port ' + 3000)
})
