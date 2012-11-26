
var stream = require('stream')
  , util = require('util')
  , log = require('./logger')
  , extractors = [] //instances
  , regexes = {
    a: /<a\b[^>]*?href="([^"]*?)"[^>]*?>(.*?)<\/a>/ig
  };

function Extractor (num, feeder) {
  //Stream Api
  stream.Stream.call(this);
  this.writable = true;

  this.num = num;
  this.buffer = [];
  this.feeder = feeder;

  this.on('error', function (err) {
    log.error('extractor error: %s', err.message);
  });

}

//we are a Stream
util.inherits(Extractor, stream.Stream);

Extractor.prototype.end = function () {
  //TODO save this.buffer somewhere

  //TODO check for errors
  this.callback();
};

Extractor.prototype.write = function(chunk) {
  var match
    , self = this;

  this.buffer.push(chunk);

  //TODO run this async
  while ((match = regexes.a.exec(chunk)) !== null) {
    var url = match[1]
      , text = match[2];

    if (url) {
      self.feeder.enqueue(url);
    }
  }

};

/**
 * init Extractor
 */
Extractor.prototype.init = function (url, cb) {

  this.buffer = [];
  this.url = url;
  this.callback = cb;

};

module.exports = Extractor;
