#!/usr/bin/env node

/*
 * Import an initial list of URLs.
 * Every url is mapped to the responsible URL-block automatically.
 */

var url = require('../lib/url')
  , options = require('../lib/config')().storage.options
  , log = require('../lib/logger')
  , store = require('../lib/store').get('importer')
  , fs = require('fs')
  , listPath = process.argv[2];

if (!listPath) {
  console.log('usage: ' + process.argv[1] + ' path-to-urls');
  process.exit(1);
}

var content = fs.readFileSync(listPath, 'utf-8');

content.split('\n').forEach(function (line) {
  //make sure it is one.
  try {
    var validUrl   = url.parse(line).href;
    var key = url.map(validUrl) + ':urls';

    store.zadd(key, 0, validUrl, function (err) {
      if (err) { throw err; }
    });

    console.log(url.map(validUrl) + ' <-> ' + validUrl);
  } catch (e) {
    log.warn(line + ' is not an url. error: ' + e);
  }

});

