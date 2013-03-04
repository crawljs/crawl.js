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

  var filterConfig = conf.feeder.filter;

  return filters[filterConfig.type](urlObj, filterConfig.arg);

}

/*
 * init Feeder for a given url
 */

var Feeder = function (urlObj) {

  initialUrl = urlObj;

  events.EventEmitter.call(this);

};

util.inherits(Feeder, events.EventEmitter);


Feeder.prototype.size = function () {
  return queue.length;
};

/*
 * TODO
 *  - add more logic here.
 *  - maybe move logic if url is accepted or not somewhere else
 */

Feeder.prototype.enqueue = function (urlObj) {

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

Feeder.prototype.dequeue = function () {
  return queue.shift();
};

module.exports = Feeder;
