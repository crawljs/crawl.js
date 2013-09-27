
/*
 * Hbase store. using thrift api.
 */

var log  = require('../logger')
  , hbase = require('hbase')
  , util = require('util');

function Hbase(name, options) {

  options = options || {};

  this.name = name;

  var client
    , self = this;

  if (!options.host) { throw new Error('must specify options.host!');}
  if (!options.port) { throw new Error('must specify options.port!');}

  this.client = new hbase.Client({
      host: options.host
    , port: options.port
  });

  //make sure to enable `crawljs` table on the hbase shell

}

Hbase.prototype.put = function (key, value, timestamp) {
  var self = this;
  self.client.getRow('crawljs', key)
    .put(['data'],[value], function (err) {
      if (err) {
        log.error('[store.hbase %s] error: %s', self.name, err.message);
      }
  });
};


/* export us */
module.exports = Hbase;
