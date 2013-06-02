/*
 * A simple internal in memory queue. implemented with an array.
 */

var events = require('events')
  , util = require('util');


var Queue = module.exports = function (limit) {

  if (!limit) { throw new Error('Queue needs a limit! (nof entries)'); }

  this.entries = [];
  this.limit = limit;

  events.EventEmitter.call(this);

};

util.inherits(Queue, events.EventEmitter);


Queue.prototype.size = function () {
  return this.entries.length;
};

Queue.prototype.isFull = function () {
  return this.size() >= this.limit;
};

Queue.prototype.enqueue = function (entry) {
  if (!this.isFull()) {
    this.entries.push(entry);
    this.emit('url');
    return true;
  } else {
    this.emit('full');
    return false;
  }
};

Queue.prototype.dequeue = function () {
  return this.entries.shift();
};
