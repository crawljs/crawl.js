/*
 * A simple queue. implemented with an array.
 */

var log = require('./logger')
  , url = require('./url')
  , queue = []
  , hist = {}; //history

/*
 * init Feeder for a given `domain`
 */

var Feeder = function (domain) {

  if (!domain) { throw new Error('Missing `domain` parameter.'); }

  this.domain = domain;

};

/*
 * TODO
 *  - add more logic here.
 *  - maybe move logic if url is accepted or not somewhere else
 */

Feeder.prototype.enqueue = function (urlObj) {
  if (!urlObj) { return;}
  if (!(urlObj.protocol === 'http:' || urlObj.protocol === 'https:')) {
    log.warn('skipping url: %s', url.format(urlObj) );
    return;
  }

  var domain = url.domain(urlObj);

  if (domain === this.domain) {
    //we dont want query an hash part
    var entry = urlObj.protocol + '//' + urlObj.hostname + urlObj.pathname;
    //check history
    if (!hist[entry]) {
      queue.push(entry);
      hist[entry] = true;
    }
  }
};

Feeder.prototype.dequeue = function () {
  return queue.shift();
};

module.exports = Feeder;
