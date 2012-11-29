
var MAX_CONN = 1;

var log     = require('./lib/logger')
  , Feeder  = require('./lib/feeder')
  , url     = require('./lib/url')
  , domainName  = process.argv[2] || 'unine.ch'
  , feeder  = new Feeder(domainName)
  , fetcher = require('./lib/fetcher')(MAX_CONN, feeder)
  , start   = Date.now();

function crawl() {

  if (fetcher.busy()) {
    //max number of concurrent connections reached. `MAX_CONN`
    return;
  }

  fetcher.get(feeder.dequeue(), function (err, url) {
    if (err) {
      crawl();
    } else if (url) {
      crawl();
    }
  });

}

feeder.on('url', crawl);

//TODO get seed from somewhere
//triggers `url` event which starts the crawl
feeder.enqueue(url.parse('http://www.' + feeder.domainName + '/'));

process.on('exit', function () {
  log.info('crawled %s in %s seconds', domainName, (Date.now() - start)/1000);
});
