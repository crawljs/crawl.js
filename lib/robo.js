/*
 * Cache parsed robots.txt files.
 */

var robots = require('robots'); //parser implementation
var log = require('./logger');

function Robo (userAgent, size) {

  this.size = size; //in terms of number of entries in the cache
  this.userAgent = userAgent;

  if (!this.size) { throw new Error('Missing `size` prameter');}
  if (!this.userAgent) { throw new Error('Missing `userAgent` prameter');}

  this.cache = {};
  this.lru = {};
}

Robo.prototype._get = function (host, cb) {
  var entry = this.cache[host];
  this.lru[host] = Date.now();
  if (!entry) {
    //go and get it
    entry = this.cache[host] = new robots.RobotsParser('http://' + host + '/robots.txt', this.userAgent, cb);
    this._recycle();
  } else {
    return cb(null, entry);
  }
};

/*
 * @api public
 */

Robo.prototype.allowed = function (urlObj, cb) {
  if (!urlObj && urlObj.host) {
    return cb(new Error('Missing urlObj.host!'));
  }

  var host = urlObj.host;
  var self = this;

  this._get(host, function (parser) {
    if (parser) {
      parser.canFetch(self.userAgent, urlObj.path, function (access, url, reason) {
        if (access) {
          //cool
          return cb(null);
        } else {
          return cb(new Error('not allowed. reason: ' + reason.type));
        }
      });
    } else {
      //be optimistic
      return cb(null);
    }
  });

};

Robo.prototype._recycle = function () {
  //make sure to respect cache size.
  //using a least recently used strategy
  if (Object.keys(this.lru).length >= this.size) {
    //TODO
    log.warn('[robo] TODO: Cache limit reached');
  }

};

module.exports = Robo;

