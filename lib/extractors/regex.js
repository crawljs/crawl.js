/*
 * Extract urls using RegExp.
 */
var extractor = require('../extractor')
  , log  = require('../logger')
  , url = require('../url')
  , util = require('util')
  , expr = {
    a: /<a\b[^>]*?href="([^"]*?)"[^>]*?>(.*?)<\/a>/ig
  };

function Regex (name) {

  extractor.Extractor.apply(this, arguments);

  this.name = name;

}

util.inherits(Regex, extractor.Extractor);

//nothing to do here
Regex.prototype.end = function (chunk) {
  if (chunk) { this.write(chunk); }
};

Regex.prototype.write = function(chunk) {

  var match
    , self = this;

  while ((match = expr.a.exec(chunk)) !== null) {
    var href = match[1]
      , text = match[2];

    if (href) {
      var relative = url.parse(href, false, true);
      self.found(self.urlObj.resolveObject(relative));
    }
  }

  return true;

};

module.exports = Regex;
