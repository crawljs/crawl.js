
var log  = require('../logger')
  , conf = require('../config')()
  , redis = require('redis');

function Redis(options) {

  options = options || {};

  //batches
  this._remove = [];
  this._add = {};

  if (!options.host) { throw new Error('must specify options.host!');}
  if (!options.port) { throw new Error('must specify options.port!');}
  if (!options.batchSize) { throw new Error('must specify options.batchSize!');}

  this.batchSize = options.batchSize;

  this.db = redis.createClient({ host: options.host, port: options.port});
  this.db.on('error', function (err) {
    log.error('[queue.redis] error: %s', err.message);
  });
}

function keyDone () {
  return 'urls:' + conf.block + ':done';
}

function keyNew (block) {
  return 'urls:' + block + ':new';
}

Redis.prototype._sendBatch = function (key, batch, cb) {

  cb = cb || function () {};

  if (!batch.length) {
    return cb();
  }

  var args = [key].concat(batch);
  this.db.sadd(args, cb);
};

Redis.prototype.isFull = function () {
  return false;
};

Redis.prototype.peek = function (count, cb) {
  //the difference bewtween the sets `new` and `done`
  this.db.sdiff(keyNew(conf.block), keyDone(conf.block), cb);
};

Redis.prototype.enqueue = function (entry, block) {

  var self = this
    , key = keyNew(typeof block === 'undefined' ? conf.block : block)
    , batch = this._add[key];

  //init batch for that key
  if (!batch) {
    batch = this._add[key] = [];
  }

  if(batch.length >= this.batchSize) {
    this._sendBatch(key, batch, function (err) {
      if (err) {
        log.error('[queue.redis] error: %s', err.message);
      }
      self.enqueue(entry, block);
    });
    self._add[key] = [];
  } else {
    batch.push(entry);
  }
};

Redis.prototype.remove = function (entry) {

  var self = this
    , key = keyDone();

  //removing a key means adding it to the set of `done` URLs
  if(this._remove.length >= this.batchSize) {
    this._sendBatch(key, this._remove, function (err) {
      if (err) {
        log.error('[queue.redis] error: %s', err.message);
      }
      self.remove(entry);
    });
    this._remove = [];
  } else {
    this._remove.push(entry);
  }
};

Redis.prototype.flush = function () {

  var self = this;

  for (var key in self._add) {
    self._sendBatch(key, self._add[key]);
  }

  self._sendBatch(keyDone(), self._remove);

};

Redis.prototype.quit = function () {
  this.db.quit();
};

module.exports = Redis;
