
var stream = require('stream')
  , url = require('./url')
  , util = require('util');

function Extractor () {
  //Stream Api
  stream.Stream.call(this);

  this.writable = true;

}

//we are a Stream
util.inherits(Extractor, stream.Stream);

//same for both extractors
Extractor.prototype.stream = function (options) {

  this.url = options.url;
  this.urlObj = url.parse(options.url);

  return this;
};

exports.Extractor = Extractor;

//Regex implementation
exports.Regex = require('./extractors/regex');

//Sax Parser (https://github.com/fb55/node-htmlparser)
exports.Parser = require('./extractors/parser');
