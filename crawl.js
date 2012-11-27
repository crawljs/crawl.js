
var NUMBER_OF_FETCHERS = 1;

var log     = require('./lib/logger')
  , Feeder  = require('./lib/feeder')
  , feeder  = new Feeder()
  , fetcher = require('./lib/fetcher')(NUMBER_OF_FETCHERS, feeder)
  , start   = Date.now()
  , hostname = process.argv[2] || 'www.unine.ch';

function crawl() {

  fetcher.get(feeder.dequeue(), function (err, url) {
    if (err) {
      log.error('could not crawl %s. error: %s', url, err);
      crawl();
    } else if(!url) {
      log.info('crawled %s in %s seconds', hostname, (Date.now() - start)/1000);
    } else {
      crawl();
    }
  });

}

//TODO get seed from somewhere, improve feeder
//TODO introduce event emitter api to feeder. (feeder.on('url', crawl...))
feeder.hostname = hostname;
feeder.enqueue('http://' + hostname + '/');

//start
for (var i = 0; i < NUMBER_OF_FETCHERS; i++) {
  crawl();
}
