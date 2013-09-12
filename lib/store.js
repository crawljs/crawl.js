
/*
 * Api towards a store.
 * Different engines available. (configurable by config.store)
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
Store.type = conf.store.type;

/*
 * Options specific to chosen `type`
 */
Store.options = conf.store.options;

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

Store.prototype.put = function (key, value, timestamp) {
  throw new Error('not Implemented!');
};

//Public Api
exports.get = Store.get;
exports.Store = Store;

/* Init engines */
['dummy'].forEach(function (engine){
  Store.engines[engine] = require('./stores/' + engine);
});
