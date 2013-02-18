/*
 * Extract urls using https://github.com/fb55/node-htmlparser
 */
var extractor = require('../extractor')
  , log  = require('../logger')
  , util = require('util')
  , htmlparser = require('htmlparser2')
  , url  = require('url');

function Parser (num, feeder) {

  var self = this;

  extractor.Extractor.call(this);

  this.num = num;
  this.feeder = feeder;

  this.parser = new htmlparser.Parser({onopentag: self.onOpenTag()});

}

util.inherits(Parser, extractor.Extractor);

Parser.prototype.onOpenTag = function () {
  var self = this;

  return function (name, attrs) {
    if (name === 'a' && attrs.href) {
      self.feeder.enqueue(url.resolveObject(self.url, attrs.href));
    }
  };
};


Parser.prototype.stream = function (options) {
  this.url = options.url;
  return this;
};

//nothing to do here
Parser.prototype.end = function (chunk) {
  if (chunk) { this.write(chunk); }
  this.parser.reset();
};

Parser.prototype.write = function(chunk) {
  return this.parser.write(chunk);
};

module.exports = Parser;