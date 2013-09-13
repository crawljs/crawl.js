
var log  = require('../logger')
  , conf = require('../config')()
  , redis = require('redis');

function Redis(options) {

  options = options || {};

  this.key = 'urls:' + conf.block; //name of the sorted set

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

Redis.prototype._sendBatch = function (key, batch, cb) {

  cb = cb || function () {};

  if (!batch.length) {
    return cb();
  }

  var args = [key].concat(batch);
  this.db.zadd(args, cb);
};

Redis.prototype.isFull = function () {
  return false;
};

Redis.prototype.peek = function (count, cb) {
  this.db.zrangebyscore(this.key, 0, 1, 'LIMIT', 0, count, cb);
};

Redis.prototype.enqueue = function (entry, block) {

  var self = this
    , key
    , batch;

  if (typeof block !== 'undefined') {
    key = 'urls:' + block;
  } else {
    key = this.key;
  }

  batch = this._add[key];
  //init batch for that key
  if (!batch) {
    batch = this._add[key] = [];
  }

  if(batch.length >= this.batchSize * 2) {
    this._sendBatch(key, batch, function (err) {
      if (err) {
        log.error('[queue.redis] error: %s', err.message);
      }
      self.enqueue(entry, block);
    });
    self._add[key] = [];
  } else {
    //score member, score member ..
    batch.push(Math.random()); //random value between 0,1
    batch.push(entry);
  }
};

Redis.prototype.remove = function (entry) {

  var self = this;

  //be remove an entry by setting the score to -1;
  if(this._remove.length >= this.batchSize * 2) {
    this._sendBatch(this.key, this._remove, function (err) {
      if (err) {
        log.error('[queue.redis] error: %s', err.message);
      }
      self.remove(entry);
    });
    this._remove = [];
  } else {
    this._remove.push(-1);
    this._remove.push(entry);
  }
};

Redis.prototype.flush = function () {

  var self = this;

  for (var key in self._add) {
    self._sendBatch(key, self._add[key]);
  }

  self._sendBatch(this.key, self._remove);

};

Redis.prototype.quit = function () {
  this.db.quit();
};

module.exports = Redis;
