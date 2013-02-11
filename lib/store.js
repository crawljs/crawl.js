
/*
 * A store is a stream.
 * stream where ever you want.
 */

var stream = require('stream')
  , util = require('util');


var Store = function (options) {
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

exports.Store = Store;

//Filesystem
exports.Fs = require('./stores/fs');
//Memcached protocol (tested on infinispan)
exports.Mc = require('./stores/mc');
//Cassandra
exports.Cassandra = require('./stores/cassandra');
//Hbase
exports.Hbase = require('./stores/hbase');
//Riak
exports.Riak = require('./stores/riak');
