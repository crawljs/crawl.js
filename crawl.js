
var NUMBER_OF_FETCHERS = 1
  , HOST_TO_CRAWL = 'www.unibe.ch';

var log     = require('./lib/logger')
  , Feeder  = require('./lib/feeder')
  , feeder  = new Feeder(HOST_TO_CRAWL)
  , fetcher = require('./lib/fetcher')(NUMBER_OF_FETCHERS, feeder)
  , start   = Date.now();

function crawl() {

  fetcher.get(feeder.dequeue(), function (err, url) {
    if (err) {
      log.error('could not crawl %s. error: %s', url, err);
    } else if(!url) {
      log.info('crawled %s in %s seconds', HOST_TO_CRAWL, (Date.now() - start)/1000);
    } else {
      crawl();
    }
  });

}

//start fetching
for (var i = 0; i < NUMBER_OF_FETCHERS; i++) {
  crawl();
}
