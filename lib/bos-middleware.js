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
  
  var generalContext = {
    redocOptions: JSON.stringify(_.get(swaggerConfig, 'docPublish.redocOptions', {}))
  };
  if (redocSrc) {
    generalContext.redocSrc = redocSrc;
  } else {
    generalContext.redocUrl = redocUrl;
  }
    
  // publish all the specs defined on this server
  _.forEach(swagger.getPrettySpecs(), function (specDefinition, specName) {
    var specContext = _.merge(_.pick(specDefinition.info, ['title', 'version']),
        {
          specObject: JSON.stringify(specDefinition)
        });
    _createDocRoute(specDefinition.basePath, specName, specContext);
  });

  // TODO: publish specs defined on other servers
  // (will require an array in the config with objects providing:
  //  the title, version, and specUrl for each external spec and a specName)
  // NOTE: the specUrl will be used in the template, not the downloaded object
  //        this is because we don't know when that spec will be updated so we won't embed it

  log.info('Done publishing OpenAPI documentation (%d spec(s) available under %s)', routePaths.length, docRoot);
  
  function _createDocRoute(basePath, specName, specContext) {
    var routePath = path.join(docRoot, basePath),
      context = _.merge({}, generalContext, specContext),
      specPage = whiskers.render(docTemplate, context);
    
    app.get(routePath, function (req, res) {
      res.type('html');
      res.send(specPage);
    });
    
    log.debug('Route created for spec "%s" at: %s', specName, routePath);
    routePaths.push(routePath);
  }
}
