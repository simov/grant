var Server = module.exports = exports = {
  OAuth: {
    Flows: {},
    request: require('./OAuth/request'),
  },

  OAuth2: {
    Flows: {}
  },

  Store: require('./store')
};

Server.OAuth.Flows.One = require('./flows/OAuth/one');