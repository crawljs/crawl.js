
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

//Dummy: does nothing
Store.engines.dummy = function () {
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

//Public Api
exports.get = Store.get;
exports.Store = Store;

/* Init engines */
['riak'].forEach(function (engine){
  Store.engines[engine] = require('./stores/' + engine);
});
