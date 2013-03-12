/*
 * keep url related functionalities in one place.
 * Current implementation is just a mapping to the native module.
 * + getting the domain of a parsed URL object
 *
 * http://nodejs.org/api/url.html
 */

var native = require('url')
  , crypto = require('crypto')
  , modulo = require('./config')().blocks //only base 2!!, we use a mask to do the modulo operation.
  , mask = modulo - 1;

if (!native.Url) { throw new Error('Node v0.10.x required!');}

for (var key in native) {
  exports[key] = native[key];
}

/*
 * Normalize urlObj and return a string.
 */
exports.normalize = function (urlObj) {
  if (!urlObj) { return ''; }
  //TODO more!!!
  urlObj.hash = '';
  return urlObj.format();
};

/*
 * Maps the url to a number between 0 and modulo - 1
 * using algorithm `md5`.
 */

exports.map = exports.block = function map (key) {

  if (!key) { throw new Error('Missing `key` to map!!'); }

  var hash = crypto.createHash('md5')
    , buf;

  hash.update(key, 'ascii');

  buf = hash.digest();

  return buf[buf.length - 1] & mask;

};
