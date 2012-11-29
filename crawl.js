
var MAX_CONN = 10
  , GRACE_TIME = 500; //grace time between crawls

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
  
  var url = feeder.dequeue();
  if (!url) { return; }

  fetcher.get(url, function () {
    setTimeout(crawl, GRACE_TIME);
  });

}

feeder.on('url', crawl);

//TODO get seed from somewhere
//triggers `url` event which starts the crawl
feeder.enqueue(url.parse('http://www.' + feeder.domainName + '/'));

process.on('exit', function () {
  log.info('crawled %s in %s seconds', domainName, (Date.now() - start)/1000);
});
