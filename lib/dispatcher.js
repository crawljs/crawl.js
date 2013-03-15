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
    var self = this;

    self.store.get('urls.' + block, entry, function (err, val, meta) {
      if (err && err.notFound) {
        //thats good
        self.store.put(
            'urls.' + block,
            entry,
            JSON.stringify({foundAt: Date.now(), by: conf.block}),
            {index: {crawl:1}},
            function(err) {
              if (err) { throw err; }
              //TODO: figure out what to do here!!!
            }
        );
      } else {
        //log.debug('[dispatcher] skipping existing entry: %s', entry);
      }
    });

  }
  return true;
};
