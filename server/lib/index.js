var Server = module.exports = exports = {
  OAuth: {
    Flows: {},
    request: require('./OAuth/request'),
  },

  OAuth2: {
    Flows: {}
  }
};

Server.OAuth.Flows.One = require('./flows/OAuth/one');