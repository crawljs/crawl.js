/*
 * Despatches & normalizes urls found by the crawler.
 * Either it is kept for us or dispatched to a central unit.
 */

var url = require('./url')
  , Queue = require('./queue')
  , log = require('./logger')
  , conf = require('./config')();

var Dispatcher = module.exports = function Dispatcher() {
  this.queue = new Queue(conf.queueLimit);
  this._busy = false;
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
    this.queue.enqueue(entry);
  } else {
    //it is not
    //TODO send to storage
  }
};
