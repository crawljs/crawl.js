/*
 * keep url related functionalities in one place.
 * Current implementation is just a mapping to the native module.
 * + getting the domain of a parsed URL object
 *
 * http://nodejs.org/api/url.html
 */

var native = require('url');

for (var key in native) {
  exports[key] = native[key];
}

/*
 * Takes a parsed URL object and returns the domain as a string.
 * ex. unine.ch
 */

exports.domain = function (urlObj) {
  var hostname = urlObj.hostname
    , parts;

  if (!hostname) { return; }

  parts = hostname.split('.');

  while(parts.length > 2) { parts.shift();}

  return parts.join('.');

};

