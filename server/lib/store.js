var mongode = require('mongode'),
    crypto = require('crypto'),
    config = require('../config'),
    Log = require('log'),
    log = new Log(config.environment.level);

var Store = module.exports = exports = function (options) {
  var $this = this;

  this.db = mongode.connect(options.uri);

  this.handleCallback = function (e, data, next, alternative) {
    if (e) return next(e);
    if (data) return next(undefined, data);
    if (typeof alternative === 'function') return alternative();
  };

  this.user = {};

  var generic = function (type) {
    this.type = type;

    this.getByName = function (name, next) {
      $this[this.type].findOne({ name: name }, next);
    };

    this.create = function (options, next) {
      var clause = new Store.Clause(options);
      this.getByName(options.name, function (e, data) {
        $this.handleCallback(e, data, next, function () {
          $this[this.type].insert(users.obj, { safe: true }, function (e, data) {
            $this.handleCallback(e, data, next);
          });
        });
      });
    };
  };

  this.setup = function () {
    $this.users = $this.db.collection('users');
    $this.applications = $this.db.collection('applications');
    $this.tokens = $this.db.collection('oauth_token');
    $this.nonces = $this.db.collection('oauth_nonce');

    var process = {
      user: function () {
        $this.user.create({
          name: 'nijikokun',
          email: 'nijikokun@gmail.com',
          password: Store.schemes.user.password('password')
        }, function (e, data) {
          $this.handleCallback(e, data, process.application);
        });
      },

      application: function (e, user) {
        $this.application.create({
          name: "twitter",
          user_id: user._id,
          consumer_key: "GgNc5gBWJHmGxGQzJ04gQZdZBQiWPfjJ",
          consumer_secret: "ix5iJwOXrfJQAnJF",
          callback_uri: "/some/uri"
        }, function (e, data) {
          if (e) return log.warn(e.message);
        });
      }
    };

    process.user();
  };

  return this;
};

Store.Schemes = {
  user: {
    _id: undefined,
    name: "string",
    email: "string",
    password: function (password) {
      return crypto.createHash('sha256').update(password).digest('hex');
    }
  },

  application: {
    _id: undefined,
    user_id: "string",
    consumer_key: "string",
    consumer_secret: "string",
    callback_uri: "string",
    uri: "string",
    name: "string",
    timestamp: undefined
  },

  token: {
    _id: undefined,
    user_id: "string",
    application_id: "string",
    authorized: "boolean",
    token: "string",
    token_secret: "string",
    token_type: "string",
    token_ttl: undefined,
    timestamp: undefined,
    verifier: "string",
    callback_url: "string"
  },

  nonce: {
    _id: undefined,
    timestamp: undefined,
    consumer_key: "string",
    token: "string",
    nonce: "string"
  }
};

Store.Clause = function (options) {
  this.obj = options || {};

  this.set = function (key, value) {
    if (typeof key === 'object') {
      for (var i in key)
        this.set(i, key[i]);

      return this;
    }

    this.obj[key] = value;
    return this;
  };

  this.increment = function (key, amount) {
    if (!this.obj.$inc) this.obj.$inc = {};
    this.obj.$inc[key] = amount || 1;
    return this;
  };

  this.remove = function (key) {
    delete this.obj[key];
    return this;
  };

  return this;
};