
var conf = require('./config')()
  , log = require('./logger')
  , util = require('util');


function Queue() {}

Queue.engines = {};
Queue.instances = {
  local: null,
  remote: null
};

Queue._create = function (name) {

  var instance = Queue.instances[name]
    , type = conf.queue[name].type
    , options = conf.queue[name].options;

  log.info('[queue %s] creating type: %s, options: %s', name, type, util.inspect(options));
  return new Queue.engines[type](options);

};

Queue.local = function () {

  if (Queue.instances.local) {
    return Queue.instances.local;
  }

  Queue.instances.local = Queue._create('local');

  return Queue.instances.local;

};

Queue.remote = function () {

  if (Queue.instances.remote) {
    return Queue.instances.remote;
  }

  Queue.instances.remote = Queue._create('remote');

  return Queue.instances.remote;

};


/* Things a queue engine must implement */
Queue.prototype.size = function () {
  throw new Error('not Implemented');
};

Queue.prototype.isFull = function () {
  throw new Error('not Implemented');
};

Queue.prototype.isMember = function (entry) {
  throw new Error('not Implemented');
};

Queue.prototype.enqueue = function (entry, block) {
  throw new Error('not Implemented');
};

Queue.prototype.dequeue = function () {
  throw new Error('not Implemented');
};

Queue.prototype.key = function (key) {
  throw new Error('not Implemented');
};

Queue.prototype.flush = function () {
  throw new Error('not Implemented');
};

/*
 * peek `count` elements from queue.
 * dont remove them
 */

Queue.prototype.peek = function (count) {
  throw new Error('not Implemented');
};

/*
 * remove `entry` from queue
 */
Queue.prototype.remove = function (entry) {
  throw new Error('not Implemented');
};


/* public api */
exports.local = Queue.local;
exports.remote = Queue.remote;

/* Init engines */
['redis', 'memory'].forEach(function (engine){
  Queue.engines[engine] = require('./queues/' + engine);
});
