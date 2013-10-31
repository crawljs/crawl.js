
var log  = require('./logger')
  , conf = require('./config')()
  , redis = require('redis')
  , instance;

function Seen() {

  var options = conf.seen || {};

  if (!options.host) { throw new Error('must specify options.host!');}
  if (!options.port) { throw new Error('must specify options.port!');}

  this.db = redis.createClient({ host: options.host, port: options.port});

  this.key = 'urls:' + conf.block + ':done';
  this.entries = {};

  this.db.on('error', function (err) {
    log.error('[seen] error: %s', err);
  });

}

Seen.prototype.isMember = function (entry) {
  return this.entries[entry] !== undefined;
};

Seen.prototype.add = function (entry) {
  this.entries[entry] = true;
};

Seen.prototype.init = function (cb) {

  var self = this;
  
  this.db.smembers(self.key, function (err, entries) {
    entries.forEach(function (entry) {
      self.entries[entry] = true;
    });
    log.info('[seen] initialized from redis set %s with %s entries', self.key, entries.length);
    cb(err);
  });
};

Seen.prototype.quit = function () {
  this.db.quit();
};

exports.get = function () {
  if (instance) {
    return instance;
  }

  instance = new Seen();

  return instance;

};
