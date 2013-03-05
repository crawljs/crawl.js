
/*
 * Filesystem store
 */
var store = require('../store')
  , log  = require('../logger')
  , fs   = require('fs')
  , url  = require('url')
  , path = require('path')
  , mkdirp = require('mkdirp')
  , util = require('util');

function Fs (num, _options) {
  store.Store.call(this);

  var options = _options || {};

  if (!options.dir) { throw new Error('must specify options.dir');}

  this.baseDir = options.dir;
  this.num = num;
  //fire and forget
  fs.mkdir(this.baseDir, function (){});

}

util.inherits(Fs, store.Store);

Fs.prototype.stream = function (options) {
  
  var self = this
    , urlObj = url.parse(options.url)
    , basename = path.basename(urlObj.path) || '/'
    , filePath
    , dir
    , stream;

  if (basename.charAt(basename.length - 1) === '/') {
    dir = path.join(this.baseDir, urlObj.host, path.dirname(urlObj.path), basename);
    mkdirp.sync(dir);
    filePath = path.join(dir, 'index.html');
  } else {
    dir = this.baseDir + urlObj.host + path.dirname(urlObj.path);
    mkdirp.sync(dir);
    if (!path.extname(basename)) { basename += '.html'; }
    filePath = path.join(dir, basename);
  }

  log.debug('[store.fs %s] writing to: %s', self.num, filePath);
  
  stream = fs.createWriteStream(filePath, {
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
