
var log     = require('./lib/logger')
  , Store   = require('./lib/store')
  , url     = require('./lib/url')
  , Fetcher = require('./lib/fetcher')
  , Dispatcher = require('./lib/dispatcher')
  , conf    = require('./lib/config')()
  , queue;

if (typeof conf.block === 'undefined') {
  throw new Error ('crawl.js needs to know which block it is responsible for! please specify `block` in configuration.');
}

function printQueue() {
  process.stdout.write('Queue length: ' + queue.size() + '\r');
}

function crawl() {

  if (Fetcher.isBusy()) {
    //max number of concurrent connections reached.
    return;
  }
  
  var url = queue.dequeue();

  if (!url) {
    if (!Fetcher.isActive()) {
      //TODO, restart
      return log.info('DONE!');
    } else {
      //other crawlers still running. they will trigger more events
      return;
    }
  }

  try {
    Fetcher.get(url, function () {
      //jprintQueue();
      crawl();
    });
  } catch (e) {
    log.error('fetch went wrong: %s', e);
    crawl();
  }

}

function start () {
  var store = Store.get('main');
  //query the urls we need to crawl
  store.query('urls.' + conf.block, {crawl:1}, function (err, urls) {
    if (err) {
      return log.error('could not get urls. error: ' + err);
    }
    log.info('got ' + urls.length + ' new seed urls.');

    //assemble crawler parts
    var dispatcher = new Dispatcher();
    Fetcher.init(dispatcher);

    queue = dispatcher.getQueue();
    queue.on('url', crawl);
    queue.on('full', function () {
      //Tell the dispatcher that we are busy
      dispatcher.busy();
    });

    urls.every(function (urlString) {
      //triggers `url` event which starts the crawl
      if (!queue.isFull()) {
        dispatcher.dispatch(url.parse(urlString));
        return true;
      } else {
        return false; //break out of loop
      }
    });

  });
}

start();


process.on('SIGUSR1', function () {
  log.info('dump queue');
  for (;;) {
    var url = queue.dequeue();
    if (url) {
      log.info(url);
    }
  }
});
