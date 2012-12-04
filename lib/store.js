
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
 * use us as a stream
 */
Store.prototype.init = function (options) {};
/**
 * return a strem
 */
Store.prototype.stream = function (options) {};

exports.Store = Store;

//Filesystem store
exports.Fs = require('./stores/fs');
//Memcached store
exports.Mc = require('./stores/mc');
