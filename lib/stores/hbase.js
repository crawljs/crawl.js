
/*
 * Hbase store. using thrift api.
 */

var store = require('../store')
  , log  = require('../logger')
  , hbase = require('hbase')
  , util = require('util');

function Hbase(num, _options) {
  store.Store.call(this);

  this.num = num;
  this.buffer = [];

  var options = _options || {}
    , client
    , self = this;

  if (!options.host) { throw new Error('must specify options.host!');}
  if (!options.port) { throw new Error('must specify options.port!');}

  this.client = new hbase.Client({
      host: options.host
    , port: options.port
  });

  //make sure to enable `crawljs` table on the hbase shell

}

util.inherits(Hbase, store.Store);

Hbase.prototype.write = function (chunk) {
  this.buffer += chunk;
};

Hbase.prototype.end = function (chunk) {
  if (chunk) {
    this.write(chunk);
  }

  var self = this;

  self.client.getRow('crawljs', self.key)
    .put(['page:body','page:headers'],[self.buffer, JSON.stringify(self.headers)], function (err) {
      if (err) {
        log.error('[store.hbase %s] error: %s', self.num, err.message);
      }
  });

  //reset buffer
  this.buffer = [];

};

Hbase.prototype.stream = function (options) {
  //use the url as a key
  this.key = options.url;
  this.headers = options;

  return this;
};


/* export us */
module.exports = Hbase;
