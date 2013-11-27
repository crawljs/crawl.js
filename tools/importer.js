#!/usr/bin/env node

/*
 * Import an initial list of urls into the remote queues.
 * Every url is mapped to his bucket using our internal algorithm.
 */

var url = require('../lib/url')
  , log = require('../lib/logger')
  , Mapper = require('../lib/mapper')
  , queue = require('../lib/queues').remote()
  , fs = require('fs')
  , listPath = process.argv[2];

if (!listPath) {
  console.log('usage: ' + process.argv[1] + ' path-to-urls');
  process.exit(1);
}

var content = fs.readFileSync(listPath, 'utf-8')
  , mapper = new Mapper();

content.split('\n').forEach(function (line) {

  if (!line) {
    return;
  }

  var urlObj = url.parse(line)
    , entry = url.normalize(urlObj)
    , group = mapper.group(urlObj)
    , block = mapper.block(group, urlObj);

  queue.enqueue(entry, group, block);
  log.info('imported %s to group: %s, block: %s', entry, group, block);

});

queue.flush(function (err) {
  if (err) {
    log.error('could not flush. error: ', err);
  }
  queue.quit();
});
