
/*
 * Api towards a store.
 * Different engines available. (configurable by config.storage)
 */

var conf = require('./config')()
  , log = require('./logger')
  , util = require('util');

function Store (name) {
  this.name = name;
}

/*
 * Keep track of instantiated instances
 */
Store.instances = {};

/*
 * Engine type
 */
Store.type = conf.storage.type;

/*
 * Options specific to chosen `type`
 */
Store.options = conf.storage.options;

Store.engines = {};

Store.get = function (name) {

  if (typeof name === 'undefined') { name = 'main'; }

  var instance = Store.instances[name];
  if (!instance) {
    log.info('[store %s] creating type: %s, options: %s', name, Store.type, util.inspect(Store.options));
    instance = Store.instances[name] = new Store.engines[Store.type](name);
  }

  return instance;

};

/*
 * Things a store engine must implement.
 */

Store.prototype.query = function (space, query) {
  throw new Error('not Implemented!');
};

Store.prototype.put = function (space, key, value, meta, cb) {
  throw new Error('not Implemented!');
};

Store.prototype.get = function (space, key, meta, cb) {
  throw new Error('not Implemented!');
};

/*
 * Sorted set operations we need
 * borrowed from redis.io. see: sorted sets
 */
Store.prototype.zadd = function (key, score, member, cb) {
  throw new Error('not Implemented!');
};

Store.prototype.zincrby = function (key, increment, member, cb) {
  throw new Error('not Implemented!');
};

Store.prototype.zrangebyscore = function (key, min, max, limit, cb) {
  throw new Error('not Implemented!');
};

//Public Api
exports.get = Store.get;
exports.Store = Store;

/* Init engines */
['redis'].forEach(function (engine){
  Store.engines[engine] = require('./stores/' + engine);
});
