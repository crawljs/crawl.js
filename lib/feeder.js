/*
 * A simple queue. implemented with an array.
 * filled with an intial seeds. (urls)
 */

var url = require('url')
  , log = require('./logger')
  , hist = {}; //history

var queue = [];

//stays within hostname
var Feeder = function (hostname) {
  this.hostname = hostname;
  this.enqueue('http://' + hostname + '/');
};

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
