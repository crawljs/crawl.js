
/*
 * Store using memcached protocol
 */

var log  = require('../logger')
  , memcache = require('memcache')
  , util = require('util');

function Memcached (name, options) {

  options = options || {};

  var self = this;

  if (!options.host) { throw new Error('must specify options.host');}
  if (!options.port) { throw new Error('must specify options.port');}

  function handleError(err) {
    if (err) {
      log.error('[store.memcached %s] error: %s', self.name, err.message);
    }
  }

  this.client = new memcache.Client(options.port, options.host);
  this.client.on('connect', function () { log.info('[store.memcached %s] connected', self.name);});
  this.client.on('error', handleError);
  this.client.on('timeout', handleError);

  this.name = name;

  this.buffer = [];

  this.client.connect();

}

Memcached.prototype.put = function (key, value, timestamp) {

  var self = this;

  this.client.set(key, value, function (err) {
    if (err) {
      log.error('[store.memcached %s] error: %s', self.name, err.message);
    }
  });

};

/* export us */
module.exports = Memcached;
