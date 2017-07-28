var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    whiskers = require('whiskers');

module.exports = {
  init: init
};

function init(app, config, logger, swagger) {
  var log = logger,
      docPubConfig = _processConfig(config.get('swagger'));

  log.info('Preparing OpenAPI documentation...');

  var routePath,
      docRouteFactory = new _DocRouteFactory(app, docPubConfig);

  // publish all the specs defined on this server
  _.forEach(swagger.getPrettySpecs(), function (specDefinition, specName) {
    var specContext = _.merge(_.pick(specDefinition.info, ['title', 'version']),
        {
          specObject: JSON.stringify(specDefinition)
        });
    routePath = docRouteFactory.create(specDefinition.basePath, specName, specContext);

    log.debug('Route created for spec "%s" at: %s', specName, routePath);
  });

  // TODO: publish specs defined on other servers
  // (will require an array in the config with objects providing:
  //  the title, version, and specUrl for each external spec and a specName)
  // NOTE: the specUrl will be used in the template, not the downloaded object
  //        this is because we don't know when that spec will be updated so we won't embed it

  log.info('... done publishing OpenAPI documentation (%d spec(s) available under %s)',
    docRouteFactory.getCreatedRoutePaths().length, docPubConfig.docRoot);
}

/**
 * @typedef {Object} DocPublishOptions
 * @property {String} docRoot - what is the base URL at which to publish the specs
 * @property {String} redocUrl - where the ReDoc package can be found for rendering
 * @property {String} redocOptions - behavior customization options for ReDoc
 * @property {String} docTemplate - the HTML template to be used to host the ReDoc package
 * @property {String} [redocSrc] - if the a pre-downloaded ReDoc package is to be used instead, this is it's source
 */

/**
 * Reads the swagger block from the BlueOak config,
 * and returns an object with the relevant values and defaults for this middleware.
 *
 * @param {Object} userConfig - an object containing the "swagger" config
 * @returns {DocPublishOptions} - an object representing the results of the user and default values
 */
function _processConfig(userConfig) {
  var defaultConfig = {
    docRoot: '/docs',
    redocUrl: 'https://rebilly.github.io/ReDoc/releases/v1.x.x/redoc.min.js',
    redocOptions: {},
    docTemplate: path.join(__dirname, '../templates/openapi-doc.html')
  };

  var joinedConfig = {
    docRoot: _.get(userConfig, 'docPublish.context', defaultConfig.docRoot),
    redocUrl: _.get(userConfig, 'docPublish.redocUrl', defaultConfig.redocUrl),
    redocOptions: JSON.stringify(_.get(userConfig, 'docPublish.redocOptions', defaultConfig.redocOptions)),
    docTemplate: fs.readFileSync(
      _.get(userConfig, 'docPublish.templatePath', defaultConfig.docTemplate), 'utf8')
  };

  try {
    // see if we can open the redocUrl from the file system (meaning it's a downloaded file, not a URL we should reference)
    var redocSrc = fs.readFileSync(joinedConfig.redocUrl, 'utf8');
    joinedConfig.redocSrc = redocSrc;
  } catch (error) { /* pass */ }

  return joinedConfig;
}

/**
 * A factory class that provides a method for installing an endpoint that hosts the ReDoc representation of an
 * OpenAPI spec into an express.js app.
 * @class
 *
 * @param {Object} app - the express.js app into which this will create doc publishing endpoints
 * @param {DocPublishOptions} docPubOpts - the options to be used for publishing the docs
 */
function _DocRouteFactory(app, docPubOpts) {
  var commonContext = _getCommonRedocContext(docPubOpts),
    routePaths;

  return {
    create: createDocEndpoint,
    getCreatedRoutePaths: getRoutePaths
  };

  /**
   * Creates the API method for hosting the ReDoc spec
   *
   * @param {String} basePath - the path, relative to the root, at which the doc should be published
   * @param {String} specName - the name of the spec
   * @param {Object} specContext - the special context for this spec when sent to whiskers
   *
   * @returns {String} - the path of the express endpoint created
   */
  function createDocEndpoint(basePath, specName, specContext) {
    var routePath = path.join(docPubOpts.docRoot, basePath),
      context = _.merge({}, commonContext, specContext),
      specPage = whiskers.render(docPubOpts.docTemplate, context);

    app.get(routePath, function (req, res) {
      res.type('html');
      res.send(specPage);
    });

    routePaths.push(routePath);
    return routePath;
  }

  /**
   * @returns {String[]} the list of all express routes created with this factory
   */
  function getRoutePaths() {
    return routePaths;
  }
}

/**
 * Produces the common context for the ReDoc whiskers template from the calculated options
 *
 * @param {DocPublishOptions} docPubOpts
 * @return {Object} - the common context for the ReDoc template, includes properties:
 *                    `redocOptions` and one of `redocSrc` or `redocUrl`
 */
function _getCommonRedocContext(docPubOpts) {
  var selector = (docPubOpts.redocSrc) ? 'redocSrc' : 'redocUrl',
      commonContext = {
        redocOptions: docPubOpts.redocOptions
      };
  commonContext[selector] = docPubOpts[selector];
  return commonContext;
}
