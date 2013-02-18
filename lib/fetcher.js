
var request = require('request')
  , fs = require('fs')
  , util = require('util')
  , log = require('./logger')
  , conf = require('./config')()
  , store = require('./store')
  , Extractor = require('./extractor')
  , active = 0
  , fetchers = [] // instances
  , options = conf.fetcher;

function Fetcher (num, feeder) {

  this.num = num;

  //every fetcher has its own extractor & store
  this.extractor = new Extractor(num, feeder);

  log.info('using storage: ' + conf.storage.type);
  log.info('using storage options: ' + util.inspect(conf.storage.options));

  this.store = new store[conf.storage.type](num, conf.storage.options);

}

/*
 * Round-robin dispatcher
 */

function dispatcher() {

  var next = 0;

  return function (url, cb) {
    fetchers[next++].get(url, cb);
    if (next >= fetchers.length) {
      next = 0;
    }
  };

}

/*
 * check if the fetcher is busy.
 * when he is busy it means that the max. number of concurrent connections
 * is reached.
 */

function busy() {
  return active >= fetchers.length;
}

function isActive() {
  return active > 0;
}

module.exports = function (count, feeder) {

  fetchers = [];

  for (var i = 0; i < count; i++) {
    fetchers.push(new Fetcher(i, feeder));
  }

  return {
      get: dispatcher()
    , busy: busy
    , active: isActive
  };

};

Fetcher.prototype.get = function (url, cb) {
  
  if (!url) { return cb();}

  var streams = { extractor: null, store: null }
    , self = this
    , ended = false
    , start = Date.now()
    , req;
    
  active++; //increment the number of active fetchers

  function done(err) {
    if (ended) { return; }
    active--; //decrement the number of active fetchers
    if (err) {
      log.warn('[fetcher %s] error: %s', self.num, err.message);
      var store = streams.store;
      if (store && store.writable) {
        log.warn('store stream still open, closing it now.');
        store.end();
      }
    } else {
      log.debug('[fetcher %s] crawled %s in %s seconds', self.num, url, (Date.now() - start)/1000);
    }
    cb();
    ended = true;
  }

  //init request
  options.url = url;
  req = request(options);

  //register events
  req.on('end', done);
  req.on('error', done);

  //happens before any 'data' event
  req.on('response', function (resp) {

    var options = resp.headers || {};
    options.url = url;

    if (resp.statusCode !== 200) {
      log.error('[fetcher %s] response code: %s, headers: %s', self.num, resp.statusCode, resp.headers);
      return;
    }

    //init streams
    streams.extractor = self.extractor.stream(options);
    streams.store = self.store.stream(options);

    //pipes
    req.pipe(streams.extractor);
    req.pipe(streams.store);
  });

};


