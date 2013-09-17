
var conf = require('./config')()
  , log = require('./logger')
  , Queue = require('./queue')
  , util = require('util')
  , queues = {
    local: null,
    remote: null
  };

function create (name) {

  var type = conf.queues[name].type
    , options = conf.queues[name].options;

  log.info('[queue %s] creating type: %s, options: %s', name, type, util.inspect(options));
  return new Queue.engines[type](options);

}

exports.local = function () {

  if (queues.local) {
    return queues.local;
  }

  queues.local = create('local');

  return queues.local;

};

exports.remote = function () {

  if (queues.remote) {
    return queues.remote;
  }

  queues.remote = create('remote');

  return queues.remote;

};
