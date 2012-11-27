/*
 * A simple queue. implemented with an array.
 */

var url = require('url')
  , log = require('./logger')
  , queue = []
  , hist = {}; //history

var Feeder = function () {};

/*
 * TODO
 *  - add more logic here.
 *  - maybe move logic if url is accepted or not somewhere else
 *  - introduce relative links
 *  - accept urls for a domain. (not hostname)
 *
 */

Feeder.prototype.enqueue = function (urlString) {
  //verify url
  try {
    var urlObj = url.parse(urlString);
    if (urlObj && urlObj.hostname === this.hostname) {
      //check history
      if (!hist[urlObj.pathname]) {
        queue.push(urlString);
        hist[urlObj.pathname] = true;
      }
    }
  } catch (e) {
    log.error('failed to parse url string: ' + urlString);
  }
};

Feeder.prototype.dequeue = function () {
  return queue.shift();
};

module.exports = Feeder;
