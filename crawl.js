
var log     = require('./lib/logger')
  , Store   = require('./lib/store')
  , url     = require('./lib/url')
  , Fetcher = require('./lib/fetcher')
  , Dispatcher = require('./lib/dispatcher')
  , conf    = require('./lib/config')()
  , queue
  , store
  , fetcher;

if (typeof conf.block === 'undefined') {
  throw new Error ('crawl.js needs to know which block it is responsible for! please specify `block` in configuration.');
}

store = Store.create('main');
start();

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
      //TODO, restart
      return log.info('DONE!');
    }
  }

  fetcher.get(url, function () {
    printQueue();
    crawl();
  });

}

function start () {
  store.keys('urls.' + conf.block, function (err, urls) {
    if (err) {
      log.error('could not get urls. error: ' + err);
    }
    log.info('got ' + urls.length + ' new seed urls.');

    //assemble crawler parts
    var dispatcher = new Dispatcher();
    fetcher = new Fetcher(dispatcher);

    queue = dispatcher.getQueue();
    queue.on('url', crawl);
    queue.on('full', function () {
      //Tell the dispatcher that we are busy
      dispatcher.busy();
    });

    urls.forEach(function (urlString) {
      //triggers `url` event which starts the crawl
      dispatcher.dispatch(url.parse(urlString));
    });

  });
}


process.on('SIGUSR1', function () {
  log.info('dump queue');
  for (;;) {
    var url = queue.dequeue();
    if (url) {
      log.info(url);
    }
  }
});
