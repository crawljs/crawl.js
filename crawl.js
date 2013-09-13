/*
 * Crawl.js - Entry point
 */

var log     = require('./lib/logger')
  , queues  = require('./lib/queues')
  , url     = require('./lib/url')
  , fetcher = require('./lib/fetcher')
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

/*
 * Init fetcher
 */
fetcher.init();


process.on('SIGINT', function() {
	/*
	 * Flush queues before we exit
	 */

	log.info('flushing queues...');

	var queue = queues.remote();
	queue.flush();

	setTimeout(function () {
		process.exit(0);
	}, 1000);
});


function printQueue() {
  var queue = queues.local();
  process.stdout.write('Queue length: ' + queue.size() + '\r');
}


function start () {

  var remoteQueue = queues.remote()
    , localQueue = queues.local();

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

  if (fetcher.isBusy()) {
    //max number of concurrent connections reached.
    return;
  }

  var queue = queues.local()
    , url = queue.dequeue();

  if (!url) {
    if (!fetcher.isActive()) {
      setTimeout(start, 5000);
			Dispatcher.block(false);
      return log.info('job done! waiting to restart.');
    } else {
      //other crawlers still running. they will trigger more events
      return;
    }
  }

  fetcher.get(url, function (err) {
    if (err) {
      log.error('fetch went wrong: %s', err);
    }
    printQueue();
    setImmediate(crawl);
  });

}

start();
