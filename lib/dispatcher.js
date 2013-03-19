/*
 * Despatches & normalizes urls found by the crawler.
 * Either it is kept for us or dispatched to the central storage.
 *
 * Some urls are also discarded:
 *  - not allowed to fetch
 *  - custom rules
 */

var url = require('./url')
, Queue = require('./queue')
, Fetcher = require('./fetcher')
, Robo = require('./robo')
, store = require('./store')
, log = require('./logger')
, conf = require('./config')();

var Dispatcher = module.exports = function Dispatcher() {
  this.queue = new Queue(conf.queueLimit);
  this.robo = new Robo(Fetcher.userAgent(), conf.roboLimit);
  this.history = {};
  this.stopping = false;
  this.store = store.get('dispatcher');
  this.acceptPattern = /.*\.ch$/;
};

Dispatcher.prototype.getQueue = function (){
  return this.queue;
};

/*
 * @api private
 */
Dispatcher.prototype._accept = function (urlObj, skipRobots, cb) {
  if (!urlObj || typeof urlObj === 'undefined') {
    return cb(false);
  } else if (!(urlObj.protocol && urlObj.protocol === 'http:')) {
    return cb(false);
  } else if (!this.acceptPattern.test(urlObj.hostname)) {
    return cb(false);
  } else if (!skipRobots) {
    //respect robots.txt (one robots.txt per host)
    this.robo.allowed(urlObj, function (err) {
      if (err) {
        log.debug('[dispatcher] %s is not allowed. error: %s', urlObj.href, err);
        return cb(false);
      }
      return cb(true);
    });
  } else {
    return cb(true);
  }
};

Dispatcher.prototype.dispatch = function(urlObj, skipRobots) {
  skipRobots = skipRobots || false;
  var self = this;

  this._accept(urlObj, skipRobots, function (accepted) {
    if (!accepted) {
      return;
    }
    var entry = url.normalize(urlObj)
    , block = url.block(entry);

    if (block === conf.block && !self.stopping) {
      //its for us
      if (!self.history[entry]) {
        self.history[entry] = true;
        if (!self.queue.enqueue(entry)) {
          //once the queue limit is reached, we want to empty it completely
          self.stopping = true;
        }
      }
    } else {
      //TODO batch processing
      //Substract `score` of `entry` by one hour.
      self.store.zincrby(block + ':urls', - 1000 * 60 * 60, entry, function (err) {
        if (err) {
          log.error('could not dispatch %s. error: %s', entry, err);
        }
      });
    }
  });
};
