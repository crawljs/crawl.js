
/*
 * Api towards a store.
 * Different engines available. (configurable by config.storage)
 */

var stream = require('stream')
  , conf = require('./config')()
  , log = require('./logger')
  , util = require('util')
  , type = conf.storage.type
  , options = conf.storage.options
  , cache = {}
  , engines = {};

exports.get = function (name) {
  if (typeof name === 'undefined') { name = 'main'; }

  var client = cache[name];
  if (!client) {
    log.info('[store %s] creating type: %s, options: %s', name, type, util.inspect(options));
    client = cache[name] = new engines[type](name, options);
  }

  return client;

};

var Store = exports.Store = function (options) {
  //Stream api
  stream.Stream.call(this);

  this.writable = true;

};

util.inherits(Store, stream.Stream);

/**
 * return a stream
 * implemented by concrete stores.
 */
Store.prototype.stream = function (options) {};

Store.prototype.keys = function (bucket) {
  throw new Error('not Implemented!');
};

Store.prototype.put = function (space, key, value, cb) {
  throw new Error('not Implemented!');
};


/*
 * Engines
 */

//Filesystem
engines.Fs = engines.fs = require('./stores/fs');
//Memcached protocol (tested on infinispan)
engines.Mc = engines.fs = require('./stores/mc');
//Cassandra
engines.Cassandra = engines.cassandra = require('./stores/cassandra');
//Hbase
engines.Hbase = engines.hbase = require('./stores/hbase');
//Riak
engines.Riak = engines.riak = require('./stores/riak');
//Dummy: does nothing
engines.dummy = function () {
  var noop = function () {};
  return {
    stream: function () {
      var s = new Store();
      s.writable = true;
      s.write = s.end = noop;
      return s;
    }
  };
};
