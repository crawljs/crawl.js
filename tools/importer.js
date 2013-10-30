#!/usr/bin/env node

/*
 * Import an initial list of urls into the remote queues.
 * Every url is mapped to his bucket using our internal algorithm.
 */

var url = require('../lib/url')
  , log = require('../lib/logger')
  , queue = require('../lib/queues').remote()
  , fs = require('fs')
  , listPath = process.argv[2];

if (!listPath) {
  console.log('usage: ' + process.argv[1] + ' path-to-urls');
  process.exit(1);
}

var content = fs.readFileSync(listPath, 'utf-8');

content.split('\n').forEach(function (line) {

  if (!line) {
    return;
  }

  try {
    //make sure it is one.
    var validUrl   = url.parse(line).href
      , block = url.map(validUrl);

    queue.enqueue(validUrl, block);
    console.log(block + ' <-> ' + validUrl);
  } catch (e) {
    log.warn(line + ' is not an url. error: ' + e);
  }

});

queue.flush(function (err) {
  if (err) {
    log.error('could not flush. error: ', err);
  }
  queue.quit();
});
