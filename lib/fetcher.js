/*
 * The fetcher is responsible to download the content given by an URL. (`Fetcher.get`)
 * There is only one Fetcher but multiple internal fetcher instances used to fetch content concurrently.
 */
var request = require('request')
  , fs = require('fs')
  , stream = require('stream')
  , util = require('util')
  , log = require('./logger')
  , conf = require('./config')()
  , queues = require('./queues')
  , Extractor = require('./extractor')
  , Store = require('./store');

function Fetcher (name) {

  this.name = name;

  this.remoteQueue = queues.remote();
  this.extractor = new Extractor(name);
  this.store = new Store(name);


  //response data is streamed to us
  stream.Writable.call(this);
  this.buffer = [];
  this.on('error', function (err) {
    if (err) {
      log.error('[fetcher] could not download content. error: ', err);
    }
  });
}

util.inherits(Fetcher, stream.Writable);

/*
 * Rolling counter indicating which instance is next
 */
Fetcher.next = 0;
Fetcher.active = 0; //how many instances are currently active/busy.
Fetcher.instances = [];

/*
 * check if the fetcher is busy.
 * when he is busy it means that the max. number of concurrent connections
 * is reached.
 *
 * @api public
 */
Fetcher.isBusy = function () {
  return Fetcher.active >= Fetcher.instances.length;
};

/*
 * @api public
 */

Fetcher.isActive = function () {
  return Fetcher.active > 0;
};

/*
 * Get an `url`.
 * The actual fetching is done by one of the Fetchers instance.
 * Dispatching to the responible instance is done with Rount-robin
 *
 * @api public
 */
Fetcher.get = function (url, cb) {
  if (Fetcher.isBusy()) {
    return cb(new Error('Fetcher is busy'));
  }
  
  //get first available
  Fetcher.instances.some(function (instance) {
    if (!instance.busy) {
      Fetcher.active++;
      instance.busy = true;
      instance.get(url, function () {
        Fetcher.active--;
        instance.busy = false;
        cb.apply(this, arguments);
      });
      return true;
    }
  });
};

/*
 * Init the fetcher.
 *
 * @api public
 */

Fetcher.init = function () {

  //preconfigure `request` module
  var options = conf.fetcher.request;
  options.maxSockets = conf.fetcher.instances;
  request.defaults(options);

  Fetcher.instances = [];

  for (var i = 0; i < conf.fetcher.instances; i++) {
    Fetcher.instances.push(new Fetcher('fetcher-' + i));
  }

};

Fetcher.quit = function () {
  Fetcher.instances.forEach(function (instance) {
    instance.quit();
  });
};

/*
 * Helper returning `user-agent` header of fetcher.
 */
Fetcher.userAgent = function () {
  return conf.fetcher.request.headers['User-Agent'];
};

/*
 * Stream interface
 */

Fetcher.prototype._write = function (chunk, enc, cb) {
  this.buffer.push(chunk);
  cb();
};

Fetcher.prototype.get = function (url, cb) {

  if (!url) { return cb(); }

  var self = this;

  self.url = url; //the url we are fetching
  self.buffer = [];

  function callback(err) {
    if (err) {
      log.warn('TODO: add to error queue. url: %s', self.url);
      //for now we add it to the `downloaded` queue
      self.remoteQueue.remove(self.url);
      return cb(err);
    } else {
      //all good
      //mark url as downloaded & store downloaded content
      self.remoteQueue.remove(self.url);
      self.store.put(self.url, self.buffer, Date.now());
      return cb();
    }
  }

  try {
    self.req = request.get(url);
  } catch (e) {
    return cb(e);
  }

  //on error
  self.req.on('error', callback);
  self.req.on('end', callback);

  //happens before any 'data' event
  self.req.on('response', function (resp) {

    var options = resp.headers || {}
      , ct = resp.headers['content-type'] || '';

    self.extractor.setBaseUrl(self.url);

    //parse only content-type text/* with statusCode 200
    if (resp.statusCode === 200 && (ct.indexOf('text/') >= 0 || ct === '')) {
      resp.pipe(self.extractor, {end: false}); //keep extrator open
    }

    //pipe to us (calls _write)
    resp.pipe(self, {end: false});

  });

};

Fetcher.prototype.quit = function () {
  if(this.req) {
    log.info('aborting connections');
    this.req.abort();
  }
};

//Public API
exports.init = Fetcher.init;
exports.get = Fetcher.get;
exports.isActive = Fetcher.isActive;
exports.activeCount = function () { return Fetcher.active; };
exports.isBusy = Fetcher.isBusy;
exports.userAgent = Fetcher.userAgent;
exports.quit = Fetcher.quit;
