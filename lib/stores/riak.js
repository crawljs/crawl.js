
/*
 * Riak store.
 */

var store = require('../store')
  , log  = require('../logger')
  , riak = require('riak-js')
  , util = require('util');

function Riak(num, _options) {
  store.Store.call(this);

  this.num = num;
  this.buffer = [];

  var options = _options || {}
    , self = this;

  if (!options.host) { throw new Error('must specify options.host!');}
  if (!options.port) { throw new Error('must specify options.port!');}

  this.db = riak.getClient({ host: options.host, port: options.port});
  this.db.on('riak.request.error', function (err) {
    if (err) {
      log.error('[stores.riak %s] error: %s', self.num, err.message);
    }
  });

}

util.inherits(Riak, store.Store);

Riak.prototype.write = function (chunk) {
  this.buffer += chunk;
};

Riak.prototype.end = function (chunk) {
  if (chunk) {
    this.write(chunk);
  }

  var self = this;
  //TODO sanitize key (url)

  self.db.save('urls', self.key, { headers: self.headers, body: self.buffer});

  //reset buffer
  this.buffer = [];

};

Riak.prototype.stream = function (options) {
  //use the url as a key
  this.key = options.url;
  this.headers = options;

  return this;
};


/* export us */
module.exports = Riak;
