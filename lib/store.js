
/*
 * Api towards a store.
 * Different engines available. (configurable by config.store)
 */

var conf = require('./config')()
  , log = require('./logger')
  , util = require('util');


function Store (name, options) {}

/*
 * Store interface
 */
Store.prototype.put = function (key, value, timestamp) {
  throw new Error('not Implemented!');
};

module.exports = function (name) {

  var options = conf.store.options || {}
    , engines = ['dummy', 'riak', 'cassandra', 'hbase', 'memcached'] /* Available engines: see ./lib/stores/*.js */
    , engine = conf.store.type;

  if (engines.indexOf(engine) >= 0) {
    Store.engine = Store.engine || require('./stores/' + engine);
    return new Store.engine(name, options);
  } else {
    log.error('invalid store type');
  }
};
