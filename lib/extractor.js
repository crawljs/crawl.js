
var stream = require('stream')
  , util = require('util')
  , log = require('./logger')
  , url = require('./url')
  , regexes = {
    a: /<a\b[^>]*?href="([^"]*?)"[^>]*?>(.*?)<\/a>/ig
  };

function Extractor (num, feeder) {
  //Stream Api
  stream.Stream.call(this);

  this.writable = true;

  this.num = num;
  this.feeder = feeder;

  this.on('error', function (err) {
    log.error('extractor error: %s', err.message);
  });

}

//we are a Stream
util.inherits(Extractor, stream.Stream);

//nothing to do here
Extractor.prototype.end = function (chunk) {
  if (chunk) { this.write(chunk); }
};

Extractor.prototype.write = function(chunk) {

  var match
    , self = this;

  //TODO run this async
  while ((match = regexes.a.exec(chunk)) !== null) {
    var href = match[1]
      , text = match[2];

    if (href) {
      self.feeder.enqueue(url.resolveObject(self.url, href));
    }
  }

  return true;

};

/**
 * init Extractor
 */
Extractor.prototype.init = function (options) {
  this.url = options.url;
};

module.exports = Extractor;
