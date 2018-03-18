
module.exports = (provider) =>
  provider.redirect_uri ||
  [
    provider.protocol,
    '://',
    provider.host,
    (provider.path || ''),
    '/connect/',
    provider.name,
    '/callback'
  ].join('')
