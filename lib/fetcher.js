
var request = require('request')
  , fs = require('fs')
  , log = require('./logger')
  , store = require('./store')
  , Extractor = require('./extractor')
  , active = 0
  , fetchers = [] // instances
  , options = {
      url: '' // will be set later
    , timeout: 3000 // 3 seconds
  };

function Fetcher (num, feeder) {

  this.num = num;
  
  //every fetcher has its own extractor & store
  this.extractor = new Extractor(num, feeder);
  //TODO move store configuration to crawl.js
  this.store = new store.Fs({dir: __dirname + '/../data/'});

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

module.exports = function (count, feeder) {

  fetchers = [];

  for (var i = 0; i < count; i++) {
    fetchers.push(new Fetcher(i, feeder));
  }

  return {
      get: dispatcher()
    , busy: busy
  };

};

Fetcher.prototype.get = function (url, cb) {
  
  if (!url) { return cb();}

  var extractor = this.extractor
    , req
    , self = this
    , store = this.store
    , start = Date.now();
    
  active++; //increment the number of active fetchers

  function done(err) {
    active--; //decrement the number of active fetchers
    if (err) {
      log.warn('[fetcher %s] error: %s', self.num, err.message);
      cb (err, url);
    } else {
      log.info('[fetcher %s] crawled %s in %s seconds', self.num, url, (Date.now() - start)/1000);
      cb (null, url);
    }
  }

  //init extractor
  extractor.init(url);

  //init request
  options.url = url;
  req = request(options);

  //register events
  req.on('end', done);
  req.on('error', done);

  //pipes
  req.pipe(extractor);
  req.pipe(store.stream({filename: url}));

};


