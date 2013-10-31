var events = require('events')
  , util = require('util');

function Memory (options) {

  this.array = [];

  if (!options.limit) { throw new Error('must specify options.limit!');}
  this.limit = options.limit;

  events.EventEmitter.call(this);

}

util.inherits(Memory, events.EventEmitter);

Memory.prototype.size = function () {
  return this.array.length;
};

Memory.prototype.isFull = function () {
  return this.size() >= this.limit;
};

Memory.prototype.enqueue = function (entry) {
  if (!this.isFull()) {
    this.array.push(entry);
    this.emit('url');
    return true;
  }
  return false;
};

Memory.prototype.dequeue = function () {
  var entry = this.array.shift();
  return entry;
};

Memory.prototype.flush = function () {
  this.array= [];
};

Memory.prototype.quit = function () {
  //nothing to do here
};

module.exports = Memory;
