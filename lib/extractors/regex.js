/*
 * Extract urls using RegExp.
 */
var extractor = require('../extractor')
  , log  = require('../logger')
  , util = require('util')
  , url  = require('url')
  , expr = {
    a: /<a\b[^>]*?href="([^"]*?)"[^>]*?>(.*?)<\/a>/ig
  };

function Regex (num, feeder) {

  extractor.Extractor.call(this);

  this.num = num;
  this.feeder = feeder;

}

util.inherits(Regex, extractor.Extractor);

Regex.prototype.stream = function (options) {
  this.url = options.url;
  return this;
};

//nothing to do here
Regex.prototype.end = function (chunk) {
  if (chunk) { this.write(chunk); }
};

Regex.prototype.write = function(chunk) {

  var match
    , self = this;

  //TODO run this async
  while ((match = expr.a.exec(chunk)) !== null) {
    var href = match[1]
      , text = match[2];

    if (href) {
      self.feeder.enqueue(url.resolveObject(self.url, href));
    }
  }

  return true;

};

module.exports = Regex;
