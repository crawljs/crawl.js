/*
 * Despatches & normalizes urls found by the crawler.
 * Either it is kept for us or dispatched to a central unit.
 */

var url = require('./url')
  , Queue = require('./queue')
  , store = require('./store')
  , log = require('./logger')
  , conf = require('./config')();

var Dispatcher = module.exports = function Dispatcher() {
  this.queue = new Queue(conf.queueLimit);
  this.history = {};
  this.stopping = false;
  this.store = store.get('dispatcher');
};

Dispatcher.prototype.getQueue = function (){
  return this.queue;
};

Dispatcher.prototype.dispatch = function(urlObj) {
  if (!urlObj) {return true;}
  if (!url.accept(urlObj)) { return true; }

  var entry = url.normalize(urlObj)
    , block = url.block(entry);

  if (block === conf.block && !this.stopping) {
    //its for us
    if (!this.history[entry]) {
      this.history[entry] = true;
      if (!this.queue.enqueue(entry)) {
        //once the queue limit is reached, we want to empty it completely
        this.stopping = true;
        return false;
      }
    }
  } else {
    //TODO batch processing

    //Substract `score` of `entry` by one hour.
    this.store.zincrby(block + ':urls', - 1000 * 60 * 60, entry, function (err) {
      if (err) {
        log.error('could not dispatch %s. error: %s', entry, err);
      }
    });


  }
  return true;
};
