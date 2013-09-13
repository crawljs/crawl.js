/*
 * Crawl.js - Entry point
 */

var log     = require('./lib/logger')
  , queues  = require('./lib/queues')
  , url     = require('./lib/url')
  , fetcher = require('./lib/fetcher')
  , Dispatcher = require('./lib/dispatcher')
  , conf    = require('./lib/config')()
	, exit = false
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

queues.local().on('url', crawl);

process.on('SIGINT', function() {
	/*
	 * Flush queues before we exit
	 */

	log.info('flushing queues...');
	//Mark that we want to exit
	exit = true;
	Dispatcher.block(true);

	var local = queues.local()
		, remote = queues.remote();

	while(local.size() > 0) {
		var url = local.dequeue();
		remote.enqueue(url);
	}

	remote.flush();

});


function printQueue() {
  var queue = queues.local();
  process.stdout.write('Queue length: ' + queue.size() + '\r');
}


function start () {

  var remoteQueue = queues.remote()
    , localQueue = queues.local();

	if (exit) {
		log.info('quitting. (waiting for all connections to close)');
		//TODO someting is wrong with robo.js
		//requests to robots.txt are kept open..
		localQueue.quit();
		remoteQueue.quit();
		return;
	} else {
		Dispatcher.block(false);
	}

  //query the urls we need to crawl
  remoteQueue.peek(1000, function (err, urls) {
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
