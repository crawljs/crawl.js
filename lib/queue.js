/*
 * A simple queue. implemented with an array.
 */

var log = require('./logger')
  , mapper = require('./mapper')
  , events = require('events')
  , conf = require('./config')()
  , util = require('util')
  , url = require('./url')
  , filters = {}
  , queue //cache
  , hist = {}; //history

//some filters
filters.mine   = function (urlObj) { return mapper.map(urlObj.href) === conf.block; };
filters.any    = function () { return true; };
filters.none   = function () { return false; };
filters.hosts  = function (urlObj, hosts) {
  return hosts.indexOf(urlObj.hostname) >= 0;
};

/*
 * Based on configuration decide if `urlObj` is accepted.
 * @api private
 */

function accepted(urlObj) {
  if (!urlObj) { return false; }

  var filterConfig = conf.queue.filter;

  return filters[filterConfig.type](urlObj, filterConfig.arg);

}

/*
 * init Queue
 */

var Queue = function () {

  this.entries = [];

  events.EventEmitter.call(this);

};

util.inherits(Queue, events.EventEmitter);


Queue.prototype.size = function () {
  return this.entries.length;
};

/*
 * TODO
 *  - add more logic here.
 *  - maybe move logic if url is accepted or not somewhere else
 */

Queue.prototype.enqueue = function (urlObj) {

  if (!accepted(urlObj)) { return; }

  //throw away hash fragment
  urlObj.hash = '';

  var entry = urlObj.href;
  //check history
  if (!hist[entry]) {
    this.entries.push(entry);
    hist[entry] = true;
    this.emit('url');
  }

};

Queue.prototype.dequeue = function () {
  return this.entries.shift();
};

module.exports = function (force) {
  if (queue && !force) {
    return queue;
  }

  return queue = new Queue();

}
