/*
 * keep url related functionalities in one place.
 * Current implementation is just a mapping to the native module.
 *
 * + normalize
 * + depth
 *
 * http://nodejs.org/api/url.html
 */

var native = require('url');

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
  urlObj.search = '';
  return urlObj.format();
};

/*
 * Get the depth of a url (the path)
 */

exports.depth = function (urlObj) {
  if (!(urlObj && urlObj.pathname)) { return 0;}
  return urlObj.pathname.split('/').length - 2;
};
