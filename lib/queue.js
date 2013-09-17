
function Queue() {}

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

Queue.prototype.quit = function () {
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

/* Queue engines */
Queue.engines = {};
['redis', 'memory'].forEach(function (engine){
  Queue.engines[engine] = require('./queues/' + engine);
});

module.exports = Queue;
