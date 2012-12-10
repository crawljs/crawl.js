
/*
 * Cassandra store. using thrift api.
 */

var store = require('../store')
  , log  = require('../logger')
  , helenus = require('helenus')
  , util = require('util');

function Cassandra(num, _options) {
  store.Store.call(this);

  var options = _options || {}
    , pool
    , self = this;

  if (!options.keyspace) { throw new Error('must specify options.keyspace!');}
  if (!options.hosts) { throw new Error('must specify options.hosts!');}

  //defaulting to localhost:9160
  pool = new helenus.ConnectionPool({
      keyspace: options.keyspace
    , hosts: options.hosts
  });

  //init column family
  pool.connect(function (err, keyspace) {
    if (err) { throw err; }
    keyspace.get('Url', function (err, cf) {
      if (err) { throw err; }
      self.cf = cf;
    });
  });

  this.num = num;
  this.buffer = [];


}

util.inherits(Cassandra, store.Store);

Cassandra.prototype.write = function (chunk) {
  this.buffer += chunk;
};

Cassandra.prototype.end = function (chunk) {
  if (chunk) {
    this.write(chunk);
  }

  //insert into column family
  this.cf.insert(this.key, {body: this.buffer, headers: JSON.stringify(this.headers)}, function (err) {
    if (err) {
      log.error('[store.cassandra %s] error: %s', this.num, err.message);
    }
  });

  //reset buffer
  this.buffer = [];

};

Cassandra.prototype.stream = function (options) {
  //use the url as a key
  this.key = options.url;
  this.headers = options;

  return this;
};


/* export us */
module.exports = Cassandra;
