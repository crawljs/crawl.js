#!/usr/bin/env node

/* 
 * Import an initial list of urls into riak.
 * Every url is mapped to his bucket using our internal algorithm.
 */

var mapper = require('../lib/mapper')
  , url = require('../lib/url')
  , log = require('../lib/logger')
  , db = require('riak-js').getClient({encodeUri: true})
  , fs = require('fs')
  , listPath = process.argv[2]

if (!listPath) {
  console.log('usage: ' + process.argv[1] + ' path-to-urls');
  process.exit(1);
}

var content = fs.readFileSync(listPath, 'utf-8');

content.split('\n').forEach(function (line) {
  //make sure it is one.
  try {
    var validUrl   = url.parse(line).href;
    var keySpace = 'urls.' + mapper.map(validUrl);

    db.save(keySpace, validUrl, '', {contentType: 'text/plain'});

    console.log(mapper.map(validUrl) + ' <-> ' + validUrl);
  } catch (e) {
    log.warn(line + ' is not an url. error: ' + e);
  }

});

