# BlueOak Server Middleware to serve OpenAPI (Swagger) docs

Using BlueOak Server, started with `nodemon`, and this project, you can author OpenAPI (swagger) 
specs using your editor, and have them rendered and served to your browser in ReDoc.

This [BlueOak Server middleware](https://github.com/BlueOakJS/blueoak-server/wiki/Middleware) uses [ReDoc](https://github.com/Rebilly/redoc) to serve the OpenAPI (Swagger) specs defined in
a BlueOak Server project ([template](https://github.com/BlueOakJS/blueoak-server-template)).

## installation

In a BlueOak Server project ([template](https://github.com/BlueOakJS/blueoak-server-template)):

```
$ npm i --save bos-openapi-doc-server
```

## configuration

Since this is BlueOak Server middleware, it won't be used unless you configure it to be used.

In your server config (e.g. `config/default.json`):

1. add `"bos-openapi-doc-server"` to your list of `"middleware"`
2. ensure the config setting `swagger.serve` is set to `true`
3. customize what and where the docs get served in the `swagger.docPublish` object

### list of config options affecting this functionality

* `swagger.serve`: whether BlueOak Server should expose your swagger specs to the network (BOS default: `true`)
* `swagger.context`: where those specs should be served from (BOS default: `/swagger`)
* `swagger.docPublish.context`: where the ReDoc-rendered specs should be served from (default: `/docs`)
* `swagger.docPublish.redocUrl`: (optional) provides the ability to override where to get ReDoc from
  * (by default the [latest published `redoc.min.js` is used from GitHub](https://github.com/Rebilly/redoc#releases))
  * you can also use a file path if you want to use a local copy
* `swagger.docPublish.templatePath`: (optional) facilitates using [your own custom ReDoc template](https://github.com/Rebilly/redoc#configuration)
  * the template may use [whiskers](https://github.com/gsf/whiskers.js) syntax to have the follow variables added:
    * `title`: the title for the spec given in the OpenAPI definition
    * `version`: the version of the spec given in the OpenAPI definition
    * `specUrl`: the URL where BOS is serving the JSON representation of the OpenAPI definition
    * `redocSrc`: the location of the source file for ReDoc, if it is available locally
    * `redocUrl`: the location of the ReDoc source if it is to be retrieved over the network
    * the default template at [`templates/openapi-doc.html`](./templates/openapi-doc.html) is a good starting point for customization

### sample `default.json` config

```json
{
	"express": {
		"port": "3003",
		"middleware": [
      "bos-openapi-doc-server",
			"bodyParser"
		]
	},
	"cluster": {
		"maxWorkers": 1
	},
	"bodyParser": {
		"json": {}
	},
  "swagger": {
    "serve": true,
    "useLocalhost": true,
    "refCompiler": {
      "api-v1": {
        "baseSpecFile": "api-v1.yaml",
        "refDirs": [
          "v1"
        ]
      }
    },
    "docPublish": {
      "context": "/docs",
      "templatePath": "lib/templates/my-spec-docs.html"
    }
  }
}
```

That config will cause the spec defined in `swagger/api-v1.yaml` to be served at 
`localhost:3003/docs/${api-path}`, using the custom ReDoc template in your project
at `lib/templates/my-spec-docs.html`.
