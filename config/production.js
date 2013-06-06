module.exports = {
  port: 80,
  workers: require('os').cpus().length,
  protocol: 'http',
  pid: {
    dir: '/home/ec2-user/'
  },
  redis: {
    pass: null,
    host: "127.0.0.1",
    port: 6379
  }
};