/*
 * Despatches & normalizes urls found by the crawler.
 * Depending on our state we enqueue either to `local` or `remote` queue.
 *
 * Some urls are also discarded:
 *  - not allowed to fetch
 *  - custom rules
 */

var url = require('./url')
, Queue = require('./queue')
, Fetcher = require('./fetcher')
, Robo = require('./robo')
, log = require('./logger')
, conf = require('./config')();

function Dispatcher() {
  this.localQueue = Queue.local();
  this.remoteQueue = Queue.remote();
  this.robo = new Robo(Fetcher.userAgent(), conf.roboLimit);
  this.stopping = false;
  this.acceptPattern = /.*\.ch$/;
}

Dispatcher.stopping = false;

/*
 * @api private
 */
Dispatcher.prototype._accept = function (urlObj, cb) {
  if (!urlObj || typeof urlObj === 'undefined') {
    return cb(false);
  } else if (!(urlObj.protocol && urlObj.protocol === 'http:')) {
    return cb(false);
  } else if (!this.acceptPattern.test(urlObj.hostname)) {
    return cb(false);
  } else if (url.depth(urlObj) > 1) {
    return cb(false);
  } else {
    //respect robots.txt (one robots.txt per host)
    this.robo.allowed(urlObj, function (err) {
      if (err) {
        log.debug('[dispatcher] %s is not allowed. error: %s', urlObj.href, err);
        return cb(false);
      }
      return cb(true);
    });
  }
};

Dispatcher.prototype.dispatch = function(urlObj) {
  var self = this;

  this._accept(urlObj, function (accepted) {
    if (!accepted) {
      return;
    }
    var entry = url.normalize(urlObj)
    , block = url.block(entry);

    if (block === conf.block && !Dispatcher.stopping) {
      if (!self.localQueue.enqueue(entry)) {
        //once the queue limit is reached, we want to empty it completely
        Dispatcher.stopping = true;
        self.remoteQueue.enqueue(entry);
      }
    } else {
      self.remoteQueue.enqueue(entry, block);
    }
  });
};

module.exports = Dispatcher;
