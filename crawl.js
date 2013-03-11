
var log     = require('./lib/logger')
  , Queue   = require('./lib/queue')
  , url     = require('./lib/url')
  , Fetcher = require('./lib/fetcher')
  , conf    = require('./lib/config')()
  , queue
  , fetcher
  , start   = Date.now();

function printQueue() {
  process.stdout.write('Queue length: ' + queue.size() + '\r');
}

function crawl() {

  if (fetcher.busy()) {
    //max number of concurrent connections reached.
    return;
  }
  
  var url = queue.dequeue();

  if (!url) {
    if (!fetcher.active()) {
      //done
      //TODO shutdown gracefully
      process.exit(0);
    }
  }

  fetcher.get(url, function () {
    setTimeout(crawl, conf.interval);
    printQueue();
  });

}

//TODO get seed from somewhere else than command line argument
var urlArg = process.argv[2]
  , urlObj = url.parse(urlArg);

queue = new Queue(urlObj);
fetcher = new Fetcher(conf.fetchers, queue);

queue.on('url', crawl);
//triggers `url` event which starts the crawl
queue.enqueue(urlObj);

log.info('crawling %s', urlArg);

//process hooks
process.on('exit', function () {
  log.info('crawled %s in %s seconds', urlArg, (Date.now() - start)/1000);
});

process.on('SIGUSR1', function () {
  log.info('dump queue');
  for (;;) {
    var url = queue.dequeue();
    if (url) {
      log.info(url);
    }
  }
});
