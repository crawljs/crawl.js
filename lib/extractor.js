
var stream = require('stream')
  , url = require('./url')
  , log = require('./logger')
  , conf = require('./config')()
  , util = require('util')
  , engines = {};

var Extractor = exports.Extractor = function (name, dispatcher) {
  //Stream Api
  stream.Stream.call(this);
  this.writable = true;
  this.name = name;
  this.dispatcher = dispatcher;
};

exports.create = function (name, dispatcher) {
  log.info('using extractor: ' + conf.extractor);
  return new engines[conf.extractor](name, dispatcher);
};

//we are a Stream
util.inherits(Extractor, stream.Stream);

//Engines call this when they find an url
Extractor.prototype.found = function (urlObj) {
  this.dispatcher.dispatch(urlObj);
};

//same for both extractors
Extractor.prototype.stream = function (options) {

  this.url = options.url;
  this.urlObj = url.parse(options.url);

  return this;
};

//Regex implementation
engines.Regex = require('./extractors/regex');

//Sax Parser (https://github.com/fb55/node-htmlparser)
engines.Parser = require('./extractors/parser');
