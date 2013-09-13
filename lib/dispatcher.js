/*
 * Despatches & normalizes urls found by the crawler.
 * Depending on our state we enqueue either to `local` or `remote` queue.
 *
 * Some urls are also discarded:
 *  - not allowed to fetch
 *  - custom rules
 */

var url = require('./url')
, queues = require('./queues')
, fetcher = require('./fetcher')
, Robo = require('./robo')
, log = require('./logger')
, conf = require('./config')();

function Dispatcher() {
  this.localQueue = queues.local();
  this.remoteQueue = queues.remote();
  this.robo = new Robo(fetcher.userAgent(), conf.roboLimit);
  this.stopping = false;
  this.acceptPattern = /.*\.ch$/;
}

Dispatcher.blocked = false;

Dispatcher.block = function (block) {
	Dispatcher.blocked = block;
};

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
				Dispatcher.block(true);
        self.remoteQueue.enqueue(entry);
      }
    } else {
      self.remoteQueue.enqueue(entry, block);
    }
  });
};

module.exports = Dispatcher;
