
/*
 * Riak store.
 */

var store = require('../store')
  , log  = require('../logger')
  , conf = require('../config')()
  , riak = require('riak-js')
  , util = require('util');

function Riak(name, _options) {
  store.Store.call(this);

  this.name = name;
  this.buffer = [];

  var options = _options || {}
    , self = this;

  if (!options.host) { throw new Error('must specify options.host!');}
  if (!options.port) { throw new Error('must specify options.port!');}

  this.db = riak.getClient({ host: options.host, port: options.port});
  this.db.on('riak.request.error', function (err) {
    if (err) {
      log.error('[stores.riak %s] error: %s', self.name, err.message);
    }
  });

}

util.inherits(Riak, store.Store);

Riak.prototype.keys = function (vspace, cb) {
  var buffer = [];
  this.db.keys(vspace)
    .on('error', cb)
    .on('end', function() { cb(null, buffer); })
    .on('keys', function (keys) { buffer = buffer.concat(keys); })
    .start();

};

Riak.prototype.write = function (chunk) {
  this.buffer += chunk;
};

Riak.prototype.end = function (chunk) {
  if (chunk) {
    this.write(chunk);
  }

  var self = this;

  self.db.save('urls.' + conf.block + '.data', self.key, { headers: self.headers, body: self.buffer}, {encodeUri: true});

  //reset buffer
  self.buffer = [];

};

Riak.prototype.stream = function (options) {
  //use the url as a key
  this.key = options.url;
  this.headers = options;

  return this;
};


/* export us */
module.exports = Riak;
