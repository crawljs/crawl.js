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
  , Extractor = require('./extractor');


function Fetcher (name) {

  this.name = name;

  this.remoteQueue = queues.remote();
  this.extractor = new Extractor(name);

  //response data is streamed to us
  stream.Stream.call(this);
  this.writable = true;
  this._buffer = [];

}

util.inherits(Fetcher, stream.Stream);

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
  Fetcher.poolSize = conf.fetcher.poolSize;
  Fetcher.wait = conf.fetcher.wait;

  Fetcher.instances = [];

  if (!Fetcher.requestOptions.headers['User-Agent']) {
    throw new Error('Missing config fetcher.request.headers.User-Agent');
  }

  for (var i = 0; i < Fetcher.poolSize; i++) {
    Fetcher.instances.push(new Fetcher('fetcher-' + i));
  }

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
Fetcher.prototype.write = function (chunk) {
  this._buffer.push(chunk);
};

Fetcher.prototype.end = function (chunk) {

  if(chunk) {
    this.write(chunk);
  }

  //mark url as downloaded
  this.remoteQueue.remove(this._url);

  //TODO store content somewhere
  this._buffer = [];
};

Fetcher.prototype._callback = function (url, cb) {

  var called = false
    , self = this
    , start = Date.now();

  return function (err) {
    if (called) { return; }
    called = true; //make sure we are not called twice
    if (err) {
      log.warn('[%s] error: %s', self.name, err.message);
      self.end();//end and reset stream
    } else {
      log.debug('[%s] crawled %s in %s seconds', self.name, url, (Date.now() - start)/1000);
    }
    //make sure to respect the wait time
    var diff = Date.now() - start;
    if (diff < Fetcher.wait) {
      setTimeout(function () {
        cb();
      }, Fetcher.wait - diff);
    } else {
      cb();
    }
  };

};

Fetcher.prototype.get = function (url, cb) {
  
  if (!url) { return cb(); }

  var self = this
    , requestOptions = Fetcher.requestOptions
    , callback = this._callback(url, cb)
    , req;

  //the url we are fetching
  this._url = url;

  //init request
  requestOptions.url = this._url;

  try {
    req = request(Fetcher.requestOptions);
  } catch (e) {
    return cb(e);
  }

  //register events
  req.on('end', callback);
  req.on('error', callback);

  //happens before any 'data' event
  req.on('response', function (resp) {

    var options = resp.headers || {}
      , ct = resp.headers['content-type'] || '';

    self.extractor.setBaseUrl(self._url);

    //parse only content-type text/* with statusCode 200
    if (resp.statusCode === 200 && (ct.indexOf('text/') >= 0 || ct === '')) {
      req.pipe(self.extractor);
    }

    req.pipe(self);

  });

};

//Public API
exports.init = Fetcher.init;
exports.get = Fetcher.get;
exports.isActive = Fetcher.isActive;
exports.isBusy = Fetcher.isBusy;
exports.userAgent = Fetcher.userAgent;
