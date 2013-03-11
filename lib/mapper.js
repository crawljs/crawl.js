
var crypto = require('crypto')
  , url = require('./url')
  , max = 4;

/* 
 * Maps the host part of an url to a number between 0 and `max`
 * using algorithm `md5`. 
 */

function map (_url) {

  var hash = crypto.createHash('md5')
    , urlObj = url.parse(_url)
    , result = 0
    , buf;

  //only the host is interesting
  hash.update(urlObj.host, 'ascii');

  buf = new Buffer(hash.digest('binary'));

  //read 4 x 32 bit = 128bit md5 hash
  for (var offset = 0; offset < 4; offset++) {
    result += buf.readInt32LE(offset);
  }

  result = result % max;
  
  if (result < 0) { result += max; }

  return result;

}

exports.map = map;
