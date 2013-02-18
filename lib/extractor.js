
var stream = require('stream')
  , util = require('util');

function Extractor () {
  //Stream Api
  stream.Stream.call(this);

  this.writable = true;

}

//we are a Stream
util.inherits(Extractor, stream.Stream);

Extractor.prototype.stream = function (options) {};

exports.Extractor = Extractor;

//Regex implementation
exports.Regex = require('./extractors/regex');

//Sax Parser (https://github.com/fb55/node-htmlparser)
exports.Parser = require('./extractors/parser');
