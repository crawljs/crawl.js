
/*
 * Redis store.
 */

var Store = require('../store').Store
  , log  = require('../logger')
  , conf = require('../config')()
  , redis = require('redis')
  , util = require('util');

function Redis(name) {

  Store.call(this, arguments);

  this.buffer = [];

  var options = Store.options
    , self = this;

  if (!options.host) { throw new Error('must specify options.host!');}
  if (!options.port) { throw new Error('must specify options.port!');}

  this.db = redis.createClient({ host: options.host, port: options.port});
  this.db.on('error', function (err) {
    log.error('[stores.redis %s] error: %s', self.name, err);
  });
}

util.inherits(Redis, Store);

Redis.prototype.zadd = function (key, score, member, cb) {
  this.db.zadd(key, score, member, cb);
};

Redis.prototype.zincrby = function (key, increment, member, cb) {
  this.db.zincrby(key, increment, member, cb);
};

Redis.prototype.zrangebyscore = function (key, min, max, limit, cb) {
  this.db.zrangebyscore(key, min, max, 'LIMIT', 0 /* offset */, limit, cb);
};

/* export us */
module.exports = Redis;
