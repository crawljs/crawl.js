
var request = require('request')
  , log = require('./logger')
  , Extractor = require('./extractor')
  , feeder
  , fetchers = [] // instances
  , options = {
      url: '' // will be set later
    , timeout: 3000 // 3 seconds
  };

function Fetcher (num, feeder) {

  this.num = num;
  this.feeder = feeder;
  //every fetcher has its own extractor
  this.extractor = new Extractor(num, feeder);

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
    , start = Date.now();

  options.url = url;

  extractor.init(url, function (err) {
    if (err) {
      cb(err, url);
    } else {
      log.info('fetched %s in %s seconds successfully', url, (Date.now() - start)/1000);
      cb(null, url);
    }
  });
  
  request(options).pipe(extractor);

};


