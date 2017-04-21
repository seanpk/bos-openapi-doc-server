var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  whiskers = require('whiskers');

module.exports = {
  init: init
};

function init(app, config, logger, swagger) {
  var log = logger,
    swaggerConfig = config.get('swagger');

  log.info('Preparing OpenAPI documentation...');

  var docRoot = _.get(swaggerConfig, 'docPublish.context', '/docs'),
    specRoot = _.get(swaggerConfig, 'context', '/swagger'),
    redocUrl = _.get(swaggerConfig, 'docPublish.redocUrl',
      'https://rebilly.github.io/ReDoc/releases/latest/redoc.min.js'),
    docTemplate = fs.readFileSync(
        _.get(swaggerConfig, 'docPublish.templatePath',
          path.join(__dirname, '../templates/openapi-doc.html')),
        'utf8'),
    routePaths = [];

    // if the redocUrl is a file path, be sure to expose it to the network
    var redocSrc;
    try {
      redocSrc = fs.readFileSync(redocUrl, 'utf8');
    } catch (error) { /* pass */ }

  _.forEach(swagger.getPrettySpecs(), function (specDefinition, specName) {
    var context = _.merge(_.pick(specDefinition.info, ['title', 'version']),
      {
        specUrl: path.join(specRoot, specName)
      }),
    routePath = path.join(docRoot, specDefinition.basePath);

    if (redocSrc) {
      context.redocSrc = redocSrc;
    } else {
      context.redocUrl = redocUrl;
    }

    app.get(routePath, function (req, res) {
      var specPage = whiskers.render(docTemplate, context);
      res.type('html');
      res.send(specPage);
    });

    log.debug('Route created for spec "%s" at: %s', specName, routePath);
    routePaths.push(routePath);
  });

  log.info('Done publishing OpenAPI documentation (%d spec(s) available under %s)', routePaths.length, docRoot);
}
