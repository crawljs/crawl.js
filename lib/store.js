
/*
 * A store is a stream.
 * stream where ever you want.
 */

var stream = require('stream')
  , conf = require('./config')()
  , log = require('./logger')
  , util = require('util')
  , type = conf.storage.type
  , options = conf.storage.options
  , engines = {};

exports.create = function (name) {
  if (typeof name === 'undefined') { name = 'main'; }

  log.info('[store %s] type: %s, options: %s', name, type, util.inspect(options));

  return new engines[type](name, options);

}

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
}


/*
 * Engines
 */

//Filesystem
engines.Fs = require('./stores/fs');
//Memcached protocol (tested on infinispan)
engines.Mc = require('./stores/mc');
//Cassandra
engines.Cassandra = require('./stores/cassandra');
//Hbase
engines.Hbase = require('./stores/hbase');
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
