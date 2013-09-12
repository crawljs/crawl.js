var events = require('events')
  , util = require('util');

function Memory (options) {

  this.array = [];
  this.set = {};

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
    if (!this.isMember(entry)) {
      this.array.push(entry);
      this.set[entry] = true;
      this.emit('url');
    }
    return true;
  }
  return false;
};

Memory.prototype.dequeue = function () {
  var entry = this.array.shift();
  delete this.set[entry];
  return entry;
};

Memory.prototype.isMember = function (entry) {
  return this.set[entry] === true;
};

Memory.prototype.flush = function () {
  this.array= [];
  this.set = {};
};

module.exports = Memory;
