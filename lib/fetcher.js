
var request = require('request')
  , fs = require('fs')
  , log = require('./logger')
  , store = require('./store')
  , Extractor = require('./extractor')
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

module.exports = function (count, feeder) {

  fetchers = [];

  for (var i = 0; i < count; i++) {
    fetchers.push(new Fetcher(i, feeder));
  }

  return {
    get: dispatcher()
  };

};

Fetcher.prototype.get = function (url, cb) {
  
  if (!url) { return cb();}

  var extractor = this.extractor
    , req
    , store = this.store
    , start = Date.now();

  function done(err) {
    if (err) { cb (err, url);}
    else {
      log.info('crawled %s in %s seconds', url, (Date.now() - start)/1000);
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


