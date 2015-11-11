
var express = require('express')
  , session = require('express-session')
  , Grant = require('grant-express')

var config = {
  server: {
    protocol:'http',
    host:'dummy.com:3000'
  },
  facebook: {
    key:'[APP_ID]',
    secret:'[APP_SECRET]',
    callback:'/handle_callback'
  }
}

var app = express()
app.use(session({secret:'very secret'}))
app.use(new Grant(config))

app.get('/handle_callback', function (req, res) {
  console.log(req.query)
  res.end(JSON.stringify(req.query, null, 2))
})

app.listen(3000, function () {
  console.log('Express server listening on port ' + 3000)
})
