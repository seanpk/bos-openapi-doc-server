/* global describe, it */

var _ = require('lodash'),
    expect = require('chai').expect,
    fs = require('fs'),
    path = require('path'),
    rewire = require('rewire');

var middleware = rewire('../../lib/bos-middleware'),
    configProcessor = middleware.__get__('_processConfig'),
    commonContextGetter = middleware.__get__('_getCommonRedocContext'),
    specRenderer = middleware.__get__('_renderSpec'),
    defaultDocPubOpts = {
        docRoot: '/docs',
        redocUrl: 'https://rebilly.github.io/ReDoc/releases/v1.x.x/redoc.min.js',
        redocOptions: '{}',
        docTemplate: fs.readFileSync(path.join(__dirname, '../../templates/openapi-doc.html'), 'utf8')
      },
    localRedocPath = path.join(__dirname, 'data/local-redoc.js'),
    localRedocSrc = fs.readFileSync(localRedocPath, 'utf8'),
    specContext = {
      title: 'Super Swagger Spec Renderer',
      version: 'X.X.X',
      specObject: fs.readFileSync(path.join(__dirname, 'data/test-swagger.json'), 'utf8')
    };

describe('Spec rendering', function () {

  it('can render the defaults', function () {
    var commonContext = commonContextGetter(defaultDocPubOpts);
    expect(_normalizeRenderString(specRenderer(defaultDocPubOpts.docTemplate, commonContext, specContext)))
      .to.deep.equal(_getExpectedRender('data/rendered/all-defaults.html'));
  });

  it('can render a user template', function () {
    var userTemplateOpts = _.merge({}, defaultDocPubOpts, {
          docTemplate: fs.readFileSync(path.join(__dirname, 'data/my-template.html'), 'utf8')
        }),
        commonContext = commonContextGetter(userTemplateOpts);
    expect(_normalizeRenderString(specRenderer(userTemplateOpts.docTemplate, commonContext, specContext)))
      .to.deep.equal(_getExpectedRender('data/rendered/my-defaults.html'));
  });

  it('can render with a local ReDoc copy', function () {
    var localRedocOpts = _.merge({}, defaultDocPubOpts, {
          redocUrl: localRedocPath,
          redocSrc: localRedocSrc
        }),
        commonContext = commonContextGetter(localRedocOpts);
    expect(_normalizeRenderString(specRenderer(localRedocOpts.docTemplate, commonContext, specContext)))
      .to.deep.equal(_getExpectedRender('data/rendered/local-redoc.html'));
  });

  it('can handle config similar to the documented example (see README.md)', function () {
    var userConfig = require('./data/example-config.json').swagger,
        redocOpts = configProcessor(userConfig),
        commonContext = commonContextGetter(redocOpts);
    expect(_normalizeRenderString(specRenderer(redocOpts.docTemplate, commonContext, specContext)))
      .to.deep.equal(_getExpectedRender('data/rendered/example-redoc.html'));
  });

  it('can render from a URL', function () {
    var commonContext = commonContextGetter(defaultDocPubOpts),
        remoteSpecContext = {
          title: 'Swagger Example API with Examples',
          version: '2.0',
          specUrl: 'https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v2.0/json/api-with-examples.json'
        };
    expect(_normalizeRenderString(specRenderer(defaultDocPubOpts.docTemplate, commonContext, remoteSpecContext)))
      .to.deep.equal(_getExpectedRender('data/rendered/remote-spec.html'));
  });

});

function _normalizeRenderString(string) {
  return string.split(/\s+/);
}
function _getExpectedRender(filename) {
  var file = fs.readFileSync(path.join(__dirname, filename), 'utf8');
  return _normalizeRenderString(file);
}
