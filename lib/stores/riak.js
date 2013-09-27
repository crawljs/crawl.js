/*
 * Riak store.
 */

var log  = require('../logger')
  , conf = require('../config')()
  , riak = require('riak-js')
  , util = require('util');

function Riak(name, options) {

  options = options || {};

  if (!options.host) { throw new Error('must specify options.host!');}
  if (!options.port) { throw new Error('must specify options.port!');}

  this.name = name;
  this.space = 'urls:' + conf.block + ':data';

  this.db = riak.getClient({ api: 'http', host: options.host, port: options.port, encodeUri: true});
  this.db.on('riak.request.error', this._handleError());
}

Riak.prototype._handleError = function () {
  var self = this;
  return function (event) {
    if (event) {
      log.error('[stores.riak %s] could not get %s', self.name, event.path);
    }
  };
};

Riak.prototype.put = function (key, value, timestamp) {
  //timestamp not implemented
  this.db.save(this.space, key, value);
};

/* export us */
module.exports = Riak;
