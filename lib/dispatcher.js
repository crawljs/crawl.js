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
, Seen = require('./seen')
, Robo = require('./robo')
, log = require('./logger')
, conf = require('./config')();

function Dispatcher() {
  this.localQueue = queues.local();
  this.remoteQueue = queues.remote();
  this.acceptPattern = new RegExp(conf.dispatcher.acceptPattern);
  this.seen = Seen.get();
  Dispatcher.robo = Dispatcher.robo || new Robo(fetcher.userAgent(), conf.robo.limit);
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
  } else if (urlObj.href.length > 1024) { //maybe a bit pessimistic
    log.warn('url longer than 1024 characters. url: %s', urlObj.href);
		return cb(false);
  } else if (!this.acceptPattern.test(urlObj.href)) {
    return cb(false);
  } else {
    //respect robots.txt (one robots.txt per host)
		//TODO FIX robo.js
		return cb(true);
		/*
    Dispatcher.robo.allowed(urlObj, function (err) {
      if (err) {
        log.debug('[dispatcher] %s is not allowed. error: %s', urlObj.href, err);
        return cb(false);
      }
      return cb(true);
    });
		*/
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

    if (!self.seen.isMember(entry)) {
      self.seen.add(entry);
      //if the dispatcher is blocked we want to finish our crawl by emptying our local queue
      if (!Dispatcher.blocked && block === conf.block) {
        if (!self.localQueue.enqueue(entry)) {
          Dispatcher.block(true);
        }
      }
      //to keep local & remote queue in sync
      self.remoteQueue.enqueue(entry, block);
    }

  });
};

module.exports = Dispatcher;
