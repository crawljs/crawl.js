
var NUMBER_OF_FETCHERS = 1;

var log     = require('./lib/logger')
  , Feeder  = require('./lib/feeder')
  , url     = require('./lib/url')
  , domain  = process.argv[2] || 'unine.ch'
  , feeder  = new Feeder(domain)
  , fetcher = require('./lib/fetcher')(NUMBER_OF_FETCHERS, feeder)
  , start   = Date.now();

function crawl() {

  fetcher.get(feeder.dequeue(), function (err, url) {
    if (err) {
      log.error('could not crawl %s. error: %s', url, err);
      crawl();
    } else if(!url) {
      log.info('crawled %s in %s seconds', domain, (Date.now() - start)/1000);
    } else {
      crawl();
    }
  });

}

//TODO get seed from somewhere
//TODO introduce event emitter api to feeder. (feeder.on('url', crawl...))
feeder.enqueue(url.parse('http://www.' + feeder.domain + '/'));

//start
for (var i = 0; i < NUMBER_OF_FETCHERS; i++) {
  crawl();
}
