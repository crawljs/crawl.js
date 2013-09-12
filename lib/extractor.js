
var stream = require('stream')
  , url = require('./url')
  , log = require('./logger')
  , conf = require('./config')()
  , Dispatcher = require('./dispatcher')
  , util = require('util');

function Extractor (name) {
  //Stream Api
  stream.Stream.call(this);
  this.writable = true;
  this.name = name;
  this.dispatcher = new Dispatcher();
}

Extractor.engines = {};
Extractor.instances = {};

Extractor.get = function (name) {
  var instance = Extractor.instances[name];
  if (!instance) {
    log.info('[extractor %s] creating type: %s', name, conf.extractor);
    instance = Extractor.instances[name] = new Extractor.engines[conf.extractor](name);
  }
  return instance;
};

//we are a Stream
util.inherits(Extractor, stream.Stream);

//Engines call this when they find an url
Extractor.prototype.found = function (urlObj) {
  this.dispatcher.dispatch(urlObj, false);
};

Extractor.prototype.setBaseUrl = function (urlString) {
  this.url = urlString;
  this.urlObj = url.parse(urlString);
};

//init engines
//Regex implementation
//Sax Parser (https://github.com/fb55/node-htmlparser)

//engines needs to access constructor
exports.Extractor = Extractor;
['regex', 'parser'].forEach(function (engine) {
  Extractor.engines[engine] = require('./extractors/' + engine);
});

//public api
exports.get = Extractor.get;
