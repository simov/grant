
// application server options
var server = require('./server');
// application credentials
var credentials = require('./credentials');
// provider oauth settings
var oauth = require('./oauth');


// consumer application specific options
var options = {
  facebook: {
    scope: 'publish_actions,publish_stream,read_stream,manage_pages,user_groups,friends_groups',
    callback: server.callback
  },
  linkedin: {
    scope: 'r_basicprofile,r_fullprofile,r_emailaddress,r_network,r_contactinfo,rw_nus,rw_company_admin,rw_groups,w_messages',
    callback: server.callback
  },
  twitter: {
    callback: server.callback
  },
  stocktwits: {
    scope: 'read,watch_lists,publish_messages,publish_watch_lists,follow_users,follow_stocks',
    callback: server.callback
  },
  soundcloud: {
    redirect: server.callback+'/connect/soundcloud/callback',//full path callback match
    scope: 'non-expiring',
    callback: server.callback
  },
  bitly: {
    redirect: server.callback+'/connect/bitly/callback',//full path callback match
    callback: server.callback
  },
  github: {
    headers: {'User-Agent': 'AppName'},//add custom headers (not required)
    redirect: server.callback+'/connect/github/callback',
    callback: server.callback
  },
  stackexchange: {
    callback: server.callback
  }
};

exports = module.exports = function (provider) {
  return oauth[provider].get(credentials.app[provider], options[provider]);
};
