/*
 * A simple queue. implemented with an array.
 */

var log = require('./logger')
  , events = require('events')
  , util = require('util')
  , url = require('./url')
  , queue = []
  , hist = {}; //history

/*
 * init Feeder for a given `domainName`
 */

var Feeder = function (domainName) {

  if (!domainName) { throw new Error('Missing `domainName` parameter.'); }

  events.EventEmitter.call(this);

  this.domainName = domainName;

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
  if (!urlObj) { return;}
  if (!(urlObj.protocol === 'http:' || urlObj.protocol === 'https:')) {
    return;
  }

  var domainName = url.domainName(urlObj)
    , self = this;

  if (domainName === this.domainName) {
    //we dont want query an hash part
    var entry = urlObj.protocol + '//' + urlObj.hostname + urlObj.pathname;
    //check history
    if (!hist[entry]) {
      queue.push(entry);
      hist[entry] = true;
      self.emit('url');
    }
  }
};

Feeder.prototype.dequeue = function () {
  return queue.shift();
};

module.exports = Feeder;
