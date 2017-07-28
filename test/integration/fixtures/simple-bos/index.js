var server = require('blueoak-server');

server.init(function (err) {
  if (err) {
    // eslint-disable-next-line no-console
    console.error('startup failed:', err);
    return;
  }

  /* global services */
  var log = services.get('logger');
  log.info('The simple server is running.');
});
