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
  this._busy = false;
  this.store = store.get('dispatcher');
};

Dispatcher.prototype.getQueue = function (){
  return this.queue;
};

Dispatcher.prototype.busy = function () {
  this._busy = true;
};

Dispatcher.prototype.dispatch = function(urlObj) {
  if (!urlObj) {return;}

  var entry = url.normalize(urlObj)
    , block = url.block(entry);

  if (block === conf.block && !this._busy) {
    //its for us
    if (!this.history[entry]) {
      this.queue.enqueue(entry);
      this.history[entry] = true;
    }
  } else {
    //TODO batch processing
    this.store.put('urls.' + block, entry, 'by crawler', function(err) {
      if (err) { throw err; }
      //TODO: figure out what to do here!!!
    });
  }
};
