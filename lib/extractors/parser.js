/*
 * Extract urls using https://github.com/fb55/node-htmlparser
 */
var extractor = require('../extractor')
  , log  = require('../logger')
  , url = require('../url')
  , util = require('util')
  , htmlparser = require('htmlparser2');

function Parser (num, queue) {

  var self = this;

  extractor.Extractor.call(this);

  this.num = num;
  this.queue = queue;

  this.parser = new htmlparser.Parser({onopentag: self.onOpenTag()});

}

util.inherits(Parser, extractor.Extractor);

Parser.prototype.onOpenTag = function () {
  var self = this;

  return function (name, attrs) {
    if (name === 'a' && attrs.href) {
      var relative = url.parse(attrs.href, false, true);
      relative.hash = '';
      self.queue.enqueue(self.urlObj.resolveObject(relative));
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
