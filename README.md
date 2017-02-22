# BlueOak Server Middleware to serve OpenAPI (Swagger) docs

This [BlueOak Server middleware](https://github.com/BlueOakJS/blueoak-server/wiki/Middleware) uses [ReDoc](https://github.com/Rebilly/redoc) to serve the OpenAPI (Swagger) specs defined in
a BlueOak Server project ([template](https://github.com/BlueOakJS/blueoak-server-template)).

## installation

In a BlueOak Server project ([template](https://github.com/BlueOakJS/blueoak-server-template)):

```
$ npm i --save bos-openapi-doc-server
```

Do not worry about unmet peer dependencies for the `redoc` package.

## configuration

Since this is BlueOak Server middleware, it won't be used unless you configure it to be used.

In your server config (e.g. `config/default.json`):

1. add `"bos-openapi-doc-server"` to your list of `"middleware"`
2. ensure the config setting `swagger.serve` is set to `true`
3. customize what and where the docs get served in the `swagger.docPublish` object

### sample `default.json` config

```json
{
	"express": {
		"port": "3003",
		"middleware": [
      "openapi-doc-server",
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

That config will cause the spec defined in `swagger/api-v1.yaml` to be served at: `localhost:3003/docs/${api-path}`
