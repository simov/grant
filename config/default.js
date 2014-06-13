module.exports = {
  host: 'localhost:3000',
  port: 3000,
  workers: require('os').cpus().length,
  protocol: 'http',
  pid: {
    dir: './'
  },
  redis: {
    pass: null,
    host: "127.0.0.1",
    port: 6379,
    expire: 60
  },
  cookie: {
    secret: 'maeby, lets keep it a secret?'
  },
  session: {
    secret: 'no-more-secrets'
  }
};
