
var fs = require('fs');
var path = require('path');

var fpath = path.resolve(__dirname, 'config/credentials.json');

var example = {
  facebook: {
    key: 'client id',
    secret: 'client secret'
  },
  twitter: {
    key: 'consumer key',
    secret: 'consumer secret'
  }
};

if (!fs.existsSync(fpath)) {
  fs.writeFileSync(fpath, JSON.stringify(example, null, 4));
}
