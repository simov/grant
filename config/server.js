
var server = {
  host: 'passport-oauth.herokuapp.com',
  port: 3000,
  protocol: 'http'
};
server.callback = server.protocol + '://' + server.host;//final-callback


exports = module.exports = server;
