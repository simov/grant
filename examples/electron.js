const { app } = require('electron'),
  electron = require('electron'),
  grant = require('grant');

const baseUrl = 'http://grant',
  grantMiddleware = grant({});

electron.app.whenReady()
  .then(() => {
    const prefix = `${baseUrl}${grantMiddleware.config.defaults.prefix}/`,
      win = new electron.BrowserWindow({
        width: 800,
        height: 600
      });
    win.loadURL(`${prefix}hcp`);

    const redirectURLs = {};
    win.webContents.session.webRequest.onBeforeRequest(async (details, respond) => {
      if (details.url.startsWith(prefix)) {
        const { redirect, response, provider } = await grantMiddleware(details, respond);
        if (redirect) {
          const redirectURL = new URL(redirect).searchParams.get('redirect_uri');
          if (redirectURL) {
            redirectURLs[redirectURL] = `${prefix}${provider}/callback`;
          }
        }
        if (response) {
          console.log(response);
          app.quit();
        }
        return;
      }
      const { origin, pathname, search, hash } = new URL(details.url),
        redirectURL = redirectURLs[`${origin}${pathname}`];
      if (redirectURL) {
        respond({ redirectURL: `${redirectURL}${search}${hash}` });
      } else {
        respond({});
      }
    });
    return win;
  })
  .catch(() => {});
