/* global describe, it */

var _ = require('lodash'),
    expect = require('chai').expect,
    fs = require('fs'),
    path = require('path'),
    rewire = require('rewire');

var middleware = rewire('../../lib/bos-middleware'),
    configProcessor = middleware.__get__('_processConfig'),
    commonContextGetter = middleware.__get__('_getCommonRedocContext'),
    defaultDocPubOpts = {
        docRoot: '/docs',
        redocUrl: 'https://rebilly.github.io/ReDoc/releases/v1.x.x/redoc.min.js',
        redocOptions: '{}',
        docTemplate: fs.readFileSync(path.join(__dirname, '../../templates/openapi-doc.html'), 'utf8')
      },
    localRedocFile = 'test/unit/data/local-redoc.js',
    localRedocSrc = fs.readFileSync(localRedocFile, 'utf8');

describe('BOS user config and defaults', function () {

  it('can handle empty user config', function () {
    expect(configProcessor({})).to.deep.equal(defaultDocPubOpts);
  });

  it('can handle config similar to the documented example (see README.md)', function () {
    var userConfig = require('./data/example-config.json').swagger,
        result = _.merge({}, defaultDocPubOpts, {
          docRoot: userConfig.docPublish.context,
          redocOptions: JSON.stringify(userConfig.docPublish.redocOptions),
          docTemplate: fs.readFileSync(userConfig.docPublish.templatePath, 'utf8')
        });
    expect(configProcessor(userConfig)).to.deep.equal(result);
  });

  it('can override the ReDoc URL', function () {
    var redocUrl = 'https://rebilly.github.io/ReDoc/releases/latest/redoc.min.js',
        userConfig = {
          docPublish: {
            redocUrl: redocUrl
          }
        };
    expect(configProcessor(userConfig).redocUrl).to.equal(redocUrl);
  });

  it('can override the ReDoc URL to be a local file', function () {
    var userConfig = {
          docPublish: {
            redocUrl: localRedocFile
          }
        },
        result = _.merge({}, defaultDocPubOpts, userConfig.docPublish, {
          redocSrc: localRedocSrc
        });
    expect(configProcessor(userConfig)).to.deep.equal(result);
  });

});

describe('Creation of the common whiskers.js context', function () {

  it('can create a context from the defaults', function () {
    var contextWithUrl = _.pick(defaultDocPubOpts, ['redocOptions', 'redocUrl']);
    expect(commonContextGetter(defaultDocPubOpts)).to.deep.equal(contextWithUrl);
  });

  it('can create a context with the source preference', function () {
    var optsWithSrc = _.merge({ redocSrc: localRedocSrc }, defaultDocPubOpts);
    var contextWithSrc = _.pick(optsWithSrc, ['redocOptions', 'redocSrc']);
    expect(commonContextGetter(optsWithSrc)).to.deep.equal(contextWithSrc);
  });

});
