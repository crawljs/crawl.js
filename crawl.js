/*
 * Crawl.js - Entry point
 */

var log     = require('./lib/logger')
  , Store   = require('./lib/store')
  , Queue   = require('./lib/queue')
  , url     = require('./lib/url')
  , Fetcher = require('./lib/fetcher')
  , Dispatcher = require('./lib/dispatcher')
  , conf    = require('./lib/config')()
  , block = process.argv[2];

if (!block) {
  console.log('usage: %s <url-block>', process.argv[1]);
  console.log('url-blocks: [0..%d]', conf.url.blocks - 1);
  process.exit(1);
}

/*
 * The url block we are responsible for.
 */
conf.block = parseInt(block, 10);
Fetcher.init();


function printQueue() {
  var queue = Queue.local();
  process.stdout.write('Queue length: ' + queue.size() + '\r');
}


function start () {

  var store = Store.get('main')
    , remoteQueue = Queue.remote()
    , localQueue = Queue.local();

  localQueue.on('url', crawl);

  //query the urls we need to crawl
  remoteQueue.peek(10, function (err, urls) {
    if (err) {
      return log.error('could not get urls. error: ' + err);
    }
    if (!urls.length) {
      log.info('no urls to fetch. waiting to restart');
      //keep running
      setTimeout(start, 10000);
      return;
    } else {
      log.info('got ' + urls.length + ' new urls to fetch.');
      urls.forEach(function (url) {
        localQueue.enqueue(url);
      });
    }
  });

}

function crawl() {

  if (Fetcher.isBusy()) {
    //max number of concurrent connections reached.
    return;
  }

  var queue = Queue.local()
    , url = queue.dequeue();

  if (!url) {
    if (!Fetcher.isActive()) {
      setTimeout(start, 5000);
      Dispatcher.stopping = false;
      return log.info('job done! waiting to restart.');
    } else {
      //other crawlers still running. they will trigger more events
      return;
    }
  }

  Fetcher.get(url, function (err) {
    if (err) {
      log.error('fetch went wrong: %s', err);
    }
    printQueue();
    setImmediate(crawl);
  });

}

start();
