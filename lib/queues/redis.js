
var log  = require('../logger')
  , conf = require('../config')()
  , redis = require('redis');

function Redis(options) {

  options = options || {};

  //buffers
  this._remove = [];
  this._add = {};

  if (!options.host) { throw new Error('must specify options.host!');}
  if (!options.port) { throw new Error('must specify options.port!');}
  if (!options.flushInterval) { throw new Error('must specify options.flushInterval!');}

  //TODO improve flush behaviour of buffers
  var self = this;
  self.flushInterval = setInterval(function () {
    self.flush(function (err) {
      if (err) {
        log.erro('[queue.redis] could not flush buffers. error: %s', err);
      }
    });
  }, options.flushInterval);

  this.db = redis.createClient({ host: options.host, port: options.port});
  this.db.on('error', function (err) {
    log.error('[queue.redis] error: %s', err);
  });
}

function keyDone () {
  return 'urls:' + conf.block + ':done';
}

function keyNew (block) {
  return 'urls:' + block + ':new';
}

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
    , buffer = this._add[key];

  //init buffer for that key
  if (!buffer) {
    buffer = this._add[key] = [];
  }

  buffer.push(entry);

};

Redis.prototype.remove = function (entry) {

  var self = this
    , key = keyDone();

  //removing a key means adding it to the set of `done` URLs
  this._remove.push(entry);
};

Redis.prototype.flush = function (cb) {

  cb = cb || function () {}; //noop

  var self = this
    , t = this.db.multi(); //transaction

  for (var key in self._add) {
    t.sadd([key].concat(self._add[key]));
  }

  t.sadd([keyDone()].concat(self._remove));

  t.exec(function (err) {
    if (!err) {
      //empty buffers
      self._remove = [];
      self._add = {};
    }

    cb.apply(self, arguments);
  
  });

};

Redis.prototype.quit = function () {
  var self = this;
  clearInterval(self.flushInterval);
  self.db.quit();
};

module.exports = Redis;
