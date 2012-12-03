
/*
 * Filesystem store
 */
var store = require('../store')
  , log  = require('../logger')
  , fs   = require('fs')
  , util = require('util');

function Fs (num, _options) {
  store.Store.call(this);

  var options = _options || {};

  if (!options.dir) { throw new Error('must specify options.dir');}

  this.dir = options.dir;
  this.num = num;
  //fire and forget
  fs.mkdir(this.dir);

}

function sanitize (filename) {
  return filename.replace(/\//g,'_');
}

util.inherits(Fs, store.Store);

Fs.prototype.stream = function (options) {

  var path = this.dir + sanitize(options.url)
    , self = this
    , stream = fs.createWriteStream(path, {
       flags: 'w'
      , encoding: null
      , mode: 0666
    });

  stream.on('error', function (err) {
    log.warn('[store.fs %s] error: %s', self.num, err.message);
  });

  return stream;

};

module.exports = Fs;
