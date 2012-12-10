
var MAX_CONN = 10
  , GRACE_TIME = 500; //grace time between crawls

var log     = require('./lib/logger')
  , Feeder  = require('./lib/feeder')
  , url     = require('./lib/url')
  , Fetcher = require('./lib/fetcher')
  , feeder
  , fetcher
  , start   = Date.now();

function printQueue() {
  process.stdout.write('Queue length: ' + feeder.size() + '\r');
}

function crawl() {

  if (fetcher.busy()) {
    //max number of concurrent connections reached. `MAX_CONN`
    return;
  }
  
  var url = feeder.dequeue();

  if (!url) {
    if (!fetcher.active()) {
      //we are done
      //TODO shutdown gracefully
      process.exit(0);
    }
  }

  fetcher.get(url, function () {
    setTimeout(crawl, GRACE_TIME);
    printQueue();
  });

}

//TODO get seed from somewhere else than command line argument
var urlArg = process.argv[2]
  , urlObj = url.parse(urlArg)
  , domainName = url.domainName(urlObj);

feeder = new Feeder(domainName);
fetcher = new Fetcher(MAX_CONN, feeder);

feeder.on('url', crawl);
//triggers `url` event which starts the crawl
feeder.enqueue(urlObj);

log.info('crawling %s', domainName);

//process hooks
process.on('exit', function () {
  log.info('crawled %s in %s seconds', domainName, (Date.now() - start)/1000);
});

process.on('SIGINT', function () {
  log.info('dump queue');
  for (;;) {
    var url = feeder.dequeue();
    if (url) {
      log.info(url);
    } else {
      process.exit();
    }
  }
});
