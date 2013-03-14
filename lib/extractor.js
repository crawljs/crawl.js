
var stream = require('stream')
  , url = require('./url')
  , log = require('./logger')
  , conf = require('./config')()
  , util = require('util');

function Extractor (name, dispatcher) {
  //Stream Api
  stream.Stream.call(this);
  this.writable = true;
  this.name = name;
  this.dispatcher = dispatcher;
}

Extractor.engines = {};

Extractor.get = function (name, dispatcher) {
  log.info('using extractor: ' + conf.extractor);
  return new Extractor.engines[conf.extractor](name, dispatcher);
};

//we are a Stream
util.inherits(Extractor, stream.Stream);

//Engines call this when they find an url
Extractor.prototype.found = function (urlObj) {
  this.dispatcher.dispatch(urlObj);
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
