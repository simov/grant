var Server = module.exports = exports = {
  Verifier: require('./verifier')
};

Server.Verifier.OAuth.One = require('./flows/oauth_one');