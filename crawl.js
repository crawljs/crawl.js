/*
 * Crawl.js - Entry point
 */

var log     = require('./lib/logger')
  , queues  = require('./lib/queues')
  , url     = require('./lib/url')
  , fetcher = require('./lib/fetcher')
  , Dispatcher = require('./lib/dispatcher')
  , conf    = require('./lib/config')()
	, quitting = false;

/*
 * Init crawl.js
 */

function init(block) {

  if (!block) {
    console.log('usage: %s <url-block>', process.argv[1]);
    console.log('url-blocks: [0..%d]', conf.url.blocks - 1);
    process.exit(1);
  }

  conf.block = parseInt(block, 10); //virtual url-block passed as argument on startup
  queues.local().on('url', crawl); //establish event flow
  fetcher.init();

  peek(); //get urls from remote queue

}

/*
 * exit gracefully.
 * - unlink events
 * - flush queues
 * - block dispatcher
 */

function exit() {

	log.info('flushing queues...');
	quitting = true; //Mark that we want to exit
	Dispatcher.block(true);

	var local = queues.local()
		, remote = queues.remote();

  local.removeAllListeners('url');

	while(local.size() > 0) {
		var url = local.dequeue();
		remote.enqueue(url);
	}

	remote.flush();

}

function quit() {
  log.info('quitting. (waiting for all connections to close)');
	//TODO someting is wrong with robo.js
	//requests to robots.txt are kept open..
  queues.remote().quit();
}


function printQueue() {
  var queue = queues.local();
  process.stdout.write('Queue length: ' + queue.size() + '\r');
}


function peek() {

  var remoteQueue = queues.remote()
    , localQueue = queues.local();

	Dispatcher.block(false); //make sure to deblock

  //query the urls we need to crawl
  remoteQueue.peek(1000, function (err, urls) {
    if (err) {
      return log.error('could not get urls. error: ' + err);
    }
    if (!urls.length) {
      log.info('no urls to fetch. waiting to restart');
      //keep running
      setTimeout(peek, 10000);
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
      if (quitting) {
        quit();
      } else {
        log.info('job done! waiting to restart.');
        setTimeout(peek, 5000);
      }
    }
    //other crawlers still running. they will trigger more events
    return;
  }

  fetcher.get(url, function (err) {
    if (err) {
      log.error('fetch went wrong: %s', err);
    }
    printQueue();
    process.nextTick(crawl);
  });

}

/* Startup */
init(process.argv[2]);
process.on('SIGINT', exit);
