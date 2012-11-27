
var stream = require('stream')
  , util = require('util')
  , log = require('./logger')
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
Extractor.prototype.end = function () {};

Extractor.prototype.write = function(chunk) {

  var match
    , self = this;

  //TODO run this async
  while ((match = regexes.a.exec(chunk)) !== null) {
    var url = match[1]
      , text = match[2];

    if (url) {
      self.feeder.enqueue(url);
    }
  }

  return true;

};

/**
 * init Extractor
 */
Extractor.prototype.init = function (url) {
  this.url = url;
};

module.exports = Extractor;
