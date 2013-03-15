
var log     = require('./lib/logger')
  , Store   = require('./lib/store')
  , url     = require('./lib/url')
  , Fetcher = require('./lib/fetcher')
  , Dispatcher = require('./lib/dispatcher')
  , conf    = require('./lib/config')()
  , block = process.argv[2]
  , queue;

if (!block) {
  console.log('usage: %s <url-block>', process.argv[1]);
  console.log('url-blocks: [0..%d]', conf.url.blocks - 1);
  process.exit(1);
}

/*
 * The url block we are responsible for.
 */
conf.block = parseInt(block, 10);


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
      setTimeout(start, 5000);
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

function start () {
  var store = Store.get('main')
    , bucket = 'urls.' + conf.block;

  //query the urls we need to crawl
  store.query(bucket, {crawl:1}, function (err, urls) {
    if (err) {
      return log.error('could not get urls. error: ' + err);
    }
    log.info('got ' + urls.length + ' new urls.');

    //assemble crawler parts
    var dispatcher = new Dispatcher();
    Fetcher.init(dispatcher);

    queue = dispatcher.getQueue();
    queue.on('url', crawl);

    if (!urls.length) {
      //keep running
      setTimeout(start, 10000);
      return;
    }

    urls.every(function (urlString) {
      //triggers `url` event which starts the crawl
      if (dispatcher.dispatch(url.parse(urlString))) {
        store.put(bucket, urlString, {queuedAt: Date.now(), by: conf.block}, {index:{crawl: 0}}, function (err) {
          if (err) {
            log.error('could not flag url as beeing crawled. error: %s', err);
          }
        });
        return true;
      } else {
        //break out of loop as soon as our queue is full.
        return false;
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
