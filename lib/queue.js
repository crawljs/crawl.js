/*
 * A simple queue. implemented with an array.
 */

var log = require('./logger')
  , events = require('events')
  , conf = require('./config')()
  , util = require('util')
  , url = require('./url')
  , initialUrl
  , filters = {}
  , queue = []
  , hist = {}; //history

//some filters
filters.host   = function (urlObj) { return initialUrl.hostname === urlObj.hostname; };
filters.domain = function (urlObj) { return url.domainName(initialUrl) === url.domainName(urlObj); };
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
 * init Queue for a given url
 */

var Queue = function (urlObj) {

  initialUrl = urlObj;

  events.EventEmitter.call(this);

};

util.inherits(Queue, events.EventEmitter);


Queue.prototype.size = function () {
  return queue.length;
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
    queue.push(entry);
    hist[entry] = true;
    this.emit('url');
  }

};

Queue.prototype.dequeue = function () {
  return queue.shift();
};

module.exports = Queue;
