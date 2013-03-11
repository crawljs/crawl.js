#!/usr/bin/env node

var db = require('riak-js').getClient()
  , util = require('util')
  , actions = {}
  , action = process.argv[2]
  , args = process.argv.slice(3)

var instrument = {
  'riak.request.start': function(event) {
      console.log('[debug] ' + event.method.toUpperCase() + ' ' + event.path);
    }
}

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
 * List all buckets.
 */

actions.buckets = function () {
  db.buckets(handle(function (data) {
    console.log('buckets: ' + data);
  }));
}

/*
 * List all keys of `bucket`
 */

actions.keys = function (bucket) {
  if (!bucket) {
    return console.log('which keys?');
  }
  console.log('keys of bucket: ' + bucket);
  db.keys(bucket).on('keys', console.dir).start();

}

/*
 * Remove `key` from `bucket`
 */
actions.remove = function (bucket, key) {
  if (!(bucket && key)) { 
    console.log('action usage: <bucket> <key>');
    return;
  }
  db.remove(bucket, key, {encodeUri: true}, handle(function () { console.log('OK!')}));
}

if(action) {
  try{
    actions[action].apply(this, args);
  } catch (e) {
    console.log('invalid action: ' + action);
  }
} else {
  console.log('usage: ' + process.argv[1] + ' action [action-args]');
  console.log('actions: [' + Object.keys(actions).join(',') + ']');
}
