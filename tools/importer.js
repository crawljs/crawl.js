#!/usr/bin/env node

/* 
 * Import an initial list of urls into riak.
 * Every url is mapped to his bucket using our internal algorithm.
 */

var mapper = require('../lib/mapper')
  , url = require('../lib/url')
  , log = require('../lib/logger')
  , db = require('riak-js').getClient()
  , fs = require('fs')
  , listPath = process.argv[2]

if (!listPath) {
  console.log('usage: ' + process.argv[1] + ' path-to-urls');
  process.exit(1);
}

content = fs.readFileSync(listPath, 'utf-8');

content.split('\n').forEach(function (line) {
  //make sure it is one.
  try {
    var urlObj   = url.parse(line);
    var keySpace = 'urls.' + mapper.map(urlObj);

    db.save(keySpace, urlObj.href, '', {contentType: 'text/plain', encodeUri: true});

    console.log(mapper.map(urlObj) + ' <-> ' + urlObj.href);
  } catch (e) {
    log.warn(line + ' is not an url. error: ' + e);
  }

});

