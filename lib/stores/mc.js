
/*
 * Store using memcached protocol
 */

var store = require('../store')
  , log  = require('../logger')
  , memcache = require('memcache')
  , util = require('util');

function Mc (num, _options) {
  store.Store.call(this);

  var options = _options || {}
    , errHandler = handleError(this)
    , self = this;

  if (!options.host) { throw new Error('must specify options.host');}
  if (!options.port) { throw new Error('must specify options.port');}

  this.client = new memcache.Client(options.port, options.host);
  this.client.on('connect', function () { log.info('[store.mc %s] connected', self.num);});
  this.client.on('error', errHandler);
  this.client.on('timeout', errHandler);

  this.num = num;

  this.buffer = [];

  this.client.connect();

}

util.inherits(Mc, store.Store);

Mc.prototype.write = function (chunk) {
  this.buffer += chunk;
};

Mc.prototype.end = function (chunk) {
  if (chunk) {
    this.write(chunk);
  }

  //store
  this.client.set(this.key, this.buffer, handleError(this));

  //reset buffer
  this.buffer = [];

};

Mc.prototype.init = function (options) {
  //use the url as a key
  this.key = options.url;

};

/* private helpers */
function handleError(self) {
  return function (err) {
    if (err) {
      log.error('[store.mc %s] error: %s', self.num, err.message);
    }
  };
}


/* export us */
module.exports = Mc;
