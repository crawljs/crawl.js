/*
 * Extract urls using https://github.com/fb55/node-htmlparser
 */
var Extractor = require('../extractor').Extractor
  , log  = require('../logger')
  , url = require('../url')
  , util = require('util')
  , htmlparser = require('htmlparser2');

function Parser (name) {

  Extractor.apply(this, arguments);

  this.parser = new htmlparser.Parser({onopentag: this.onOpenTag()});

}

util.inherits(Parser, Extractor);

Parser.prototype.onOpenTag = function () {
  var self = this;

  return function (name, attrs) {
    if (name === 'a' && attrs.href) {
      var relative = url.parse(attrs.href, false, true);
      self.found(self.urlObj.resolveObject(relative));
    }
  };
};

Parser.prototype.end = function (chunk) {
  if (chunk) { this.write(chunk); }
  this.parser.reset();
};

Parser.prototype.write = function(chunk) {
  return this.parser.write(chunk);
};

module.exports = Parser;
