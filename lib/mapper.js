
var crypto = require('crypto')
  , modulo = 4 //only base 2!!, we use a mask to do the modulo operation.
  , mask = modulo - 1;

/*
 * Maps the url to a number between 0 and modulo - 1
 * using algorithm `md5`.
 */

function map (key) {

  if (!key) { return; }

  var hash = crypto.createHash('md5')
    , buf;

  hash.update(key, 'ascii');

  buf = hash.digest();

  return buf[buf.length - 1] & mask;

}

exports.map = map;
