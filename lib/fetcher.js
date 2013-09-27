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
  Fetcher.active++;
  Fetcher.instances[Fetcher.next++].get(url, function () {
    Fetcher.active--;
    cb.apply(this, arguments);
  });
  if (Fetcher.next >= Fetcher.instances.length) {
    Fetcher.next = 0;
  }
};

/*
 * Init the fetcher.
 *
 * @api public
 */

Fetcher.init = function () {

  Fetcher.requestOptions = conf.fetcher.request;
  Fetcher.wait = conf.fetcher.wait;

  Fetcher.instances = [];

  if (!Fetcher.requestOptions.headers['User-Agent']) {
    throw new Error('Missing config fetcher.request.headers.User-Agent');
  }

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

Fetcher.prototype.onError = function () {
  var self = this;
  return function (err) {
    self.error = err;
    self.cb(err);
  };
};

Fetcher.prototype.onFinish = function () {

  var self = this;

  return function () {
    if (self.error) {
      log.warn('callback was called already');
    } else {
      //mark url as downloaded & store downloaded content
      self.remoteQueue.remove(self.url);
      self.store.put(self.url, self.buffer, Date.now());
      self.cb();
    }
  };

};

Fetcher.prototype.get = function (url, cb) {

  if (!url) { return cb(); }

  var self = this
    , requestOptions = Fetcher.requestOptions
    , req;

  self.url = url; //the url we are fetching
  self.cb = cb;
  self.error = null;
  self.buffer = [];

  //init request
  requestOptions.url = self.url;

  try {
    req = request(Fetcher.requestOptions);
  } catch (e) {
    return cb(e);
  }

  //on error
  req.on('error', self.onError());
  req.on('end', self.onFinish());

  //happens before any 'data' event
  req.on('response', function (resp) {

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
exports.isBusy = Fetcher.isBusy;
exports.userAgent = Fetcher.userAgent;
exports.quit = Fetcher.quit;
