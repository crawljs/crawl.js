
var request = require('request')
  , fs = require('fs')
  , util = require('util')
  , log = require('./logger')
  , conf = require('./config')()
  , Store = require('./store')
  , extractor = require('./extractor')
  , active = 0
  , fetchers = [] // instances
  , options = conf.fetcher.request;

function Fetcher (name) {

  this.name = name;

  //every fetcher has its own extractor & store
  this.store = Store.get(name);
  this.extractor = extractor.create(name, Fetcher.dispatcher);

}

/*
 * Round-robin dispatcher
 */

function get() {

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

module.exports = function (dispatcher) {
  
  var poolSize = conf.fetcher.poolSize;
  Fetcher.dispatcher = dispatcher;

  fetchers = [];

  for (var i = 0; i < poolSize; i++) {
    fetchers.push(new Fetcher('fetcher-' + i));
  }

  return {
      get: get()
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
    , wait = conf.fetcher.wait
    , req;
    
  active++; //increment the number of active fetchers

  function done(err) {
    if (ended) { return; }
    if (err) {
      log.warn('[%s] error: %s', self.name, err.message);
      var store = streams.store;
      if (store && store.writable) {
        log.warn('store stream still open, closing it now.');
        store.end();
      }
    } else {
      log.debug('[%s] crawled %s in %s seconds', self.name, url, (Date.now() - start)/1000);
    }
    //make sure to respect the wait time
    var diff = Date.now() - start;
    if (diff < wait) {
      setTimeout(function () {
        active--;//decrement the number of active fetchers
        cb();
      }, wait - diff);
    } else {
      active--;
      cb();
    }
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

    var options = resp.headers || {}
      , ct = resp.headers['content-type'] || '';
    options.url = url;

    //init streams
    streams.extractor = self.extractor.stream(options);
    streams.store = self.store.stream(options);

    //pipes
    if (ct.indexOf('text/') >= 0 && resp.statusCode === 200) {
      req.pipe(streams.extractor);
      req.pipe(streams.store);
    } else {
      resp.request.abort();
    }
  });

};


