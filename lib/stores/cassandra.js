
/*
 * Cassandra store. using thrift api.
 */

var log  = require('../logger')
  , conf = require('../config')()
  , helenus = require('helenus')
  , util = require('util');

function Cassandra(name, options) {

  options = options || {};

  var pool
    , self = this;

  if (!options.keyspace) { throw new Error('must specify options.keyspace!');}
  if (!options.hosts) { throw new Error('must specify options.hosts!');}

  self.name = name;

  pool = new helenus.ConnectionPool({
      keyspace: options.keyspace
    , hosts: options.hosts
  });

  pool.on('error', function (err) {
    if (err) {
      log.error('[store.cassandra %s] error: %s', self.name, err.message);
    }
  });

  //init column family
  pool.connect(function (err, keyspace) {
    if (err) { throw err; }
    keyspace.get('urls:' + conf.block + ':data', function (err, cf) {
      if (err) { throw err; }
      self.cf = cf;
    });
  });

}

Cassandra.prototype.put = function (key, value, timestamp) {
  var self = this;
  //timestamp handled implicitly
  this.cf.insert(key, value, function (err) {
    if (err) {
      log.error('[store.cassandra %s] error: %s', self.name, err.message);
    }
  });
};

/* export us */
module.exports = Cassandra;
