#!/usr/bin/env node

var db = require('riak-js').getClient({encodeUri: true})
  , util = require('util')
  , actions = {}
  , action = process.argv[2]
  , args = process.argv.slice(3)

var instrument = {
  'riak.request.start': function(event) {
      console.log('[debug] ' + event.method.toUpperCase() + ' ' + event.path);
    }
};

db.registerListener(instrument);

function handle (cb) {
  return function () {
    var err = arguments[0]
      , args = Array.prototype.slice.call(arguments);
    if (err) { throw err; }
    cb.apply(this, args.slice(1));
  }
}

/*
 * Action: 'buckets'
 * List or purge buckets.
 */

actions.buckets = function (subAction) {
  subAction = subAction || 'list';
  var args = Array.prototype.slice.call(arguments).slice(1);
  actions.buckets[subAction].apply(this, args);
};

actions.buckets.help = function () {
  console.log('[' + Object.keys(actions.buckets).join(',') + ']');
};

actions.buckets.list = function () {
  db.buckets(handle(function (data) {
    console.log('buckets: ' + data);
  }));
};

actions.buckets.purge = function (bucket) {
  if (!bucket) {
    return console.log('which bucket?');
  }

  console.log('about to purge: %s', bucket);

  db.keys(bucket)
    .on('error', function (err) { throw err;})
    .on('end', function() { console.log('purged bucket: %s', bucket);})
    .on('keys', function (keys) {
        keys.forEach(function (key) {
          db.remove(bucket, key);
        });
      })
    .start();

};

/*
 * List all keys of `bucket`
 */

actions.keys = function (bucket) {
  if (!bucket) {
    return console.log('which keys?');
  }
  console.log('keys of bucket: ' + bucket);
  db.keys(bucket).on('keys', console.dir).start();

};

/*
 * Remove `key` from `bucket`
 */
actions.remove = function (bucket, key) {
  if (!(bucket && key)) {
    console.log('action usage: <bucket> <key>');
    return;
  }
  db.remove(bucket, key, {encodeUri: true}, handle(function () { console.log('OK!')}));
};

actions.query = function (bucket, query) {
  if (!(bucket && query)) {
    console.log('action usage: <bucket> <query>');
    console.log('the query has to be valid json, so the syntax is a bit awkward..');
    console.log('ex: urls.0 \'{"crawl":1}\'');
    return;
  }

  db.query(bucket, JSON.parse(query), function (err, answer) {
    if (err) {
      return console.log('could not execute query. error %s', err);
    } else if (!answer) {
      return console.log('empty response');
    } else {
      console.log(answer);
    }
  });

};

actions.save = function (bucket, key, value, meta) {
  if(!(bucket && key && value)) {
    console.log('action usage: <bucket> <key> <value> [meta]');
    console.log('[meta] has to be valid json, so the syntax is a bit awkward..');
    console.log('ex: \'{"index":{"crawl":1}}\'');
    return;
  }
  meta = meta || {};
  db.save(bucket, key, value, JSON.parse(meta), function (err, obj, meta) {
    if (err) { throw err; }
    console.log('saved');
    console.log('meta %s', util.inspect(meta));
  });
};

actions.get = function (bucket, key) {
  if(!(bucket && key)) {
    console.log('action usage: <bucket> <key>');
    return;
  }
  db.get(bucket, key, function (err, val, meta) {
    if (err) {
      console.error('error: %s', util.inspect(err));
    }
    console.log(val);
    console.log('meta: %s', util.inspect(meta));
  });

};

if(action) {
  if (!actions[action]) {
    return console.log('invalid action: ' + action);
  }
  actions[action].apply(this, args);
} else {
  console.log('usage: ' + process.argv[1] + ' action [action-args]');
  console.log('actions: [' + Object.keys(actions).join(',') + ']');
}
