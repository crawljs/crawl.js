
/*
 * Riak store.
 */

var Store = require('../store').Store
  , log  = require('../logger')
  , conf = require('../config')()
  , riak = require('riak-js')
  , util = require('util');

function Riak(name) {

  Store.call(this, arguments);

  this.buffer = [];

  var options = Store.options;

  if (!options.host) { throw new Error('must specify options.host!');}
  if (!options.port) { throw new Error('must specify options.port!');}

  this.db = riak.getClient({ api: 'http', host: options.host, port: options.port, encodeUri: true});
  this.db.on('riak.request.error', this._handleError());
}

util.inherits(Riak, Store);

Riak.prototype.query = function (space, query, cb) {
  this.db.query(space, query, cb);
};

Riak.prototype._handleError = function () {
  var self = this;
  return function (event) {
    if (event) {
      log.error('[stores.riak %s] could not get %s', self.name, event.path);
    }
  };
};

Riak.prototype.put = function (space, key, value, cb) {
  this.db.save(space, key, value, cb);
};


/* export us */
module.exports = Riak;
