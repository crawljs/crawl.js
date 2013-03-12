
var log     = require('./lib/logger')
  , Queue   = require('./lib/queue')
  , store   = require('./lib/store')
  , url     = require('./lib/url')
  , Fetcher = require('./lib/fetcher')
  , conf    = require('./lib/config')()
  , queue
  , fetcher
  , store;

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
      //TODO ask for more
      return log.info('DONE!');
    }
  }

  fetcher.get(url, function () {
    setTimeout(crawl, conf.interval);
    printQueue();
  });

}

if (typeof conf.block === 'undefined') {
  throw new Error ('crawl.js needs to know which block it is responsible for! please specify `block` in configuration.');
}

//init storage Engine and ask for our
store = store.create('main');
store.keys('urls.' + conf.block, function (err, urls) {
  if (err) {
    log.error('could not get urls. error: ' + err);
  }
  log.info('got ' + urls.length + ' new seed urls.');
  //assemble crawler parts
  queue = new Queue();
  queue.on('url', crawl);
  fetcher = new Fetcher(conf.fetchers, queue)

  urls.forEach(function (urlString) {
    //triggers `url` event which starts the crawl
    queue.enqueue(url.parse(urlString));
  });

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
