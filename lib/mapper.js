/*
 * Maps an 'urlObj' to a `group`.
 * And withing that group to a `block`
 */

var crypto = require('crypto')
  , conf = require('./config')();

var Mapper = module.exports = function Mapper() {

  var options = conf.mapper || {}
    , self = this;

  if (!options.groups) {
    throw new Error('missing configuration: `mapper.groups`');
  }

  this.groups = options.groups;

  if (options.rules && options.rules.length) {
    this.rules = {};
    //parse rules
    //TODO: different types of rules. based on top-level domain for example
    options.rules.forEach(function (rule) {
      self.rules[rule.hostname] = {group: rule.group};
    });
  }

};

/* 
 * map a key (string) to a number between 0 and limit - 1.
 * Bacause we do the modulo operation on the last byte (of md5 hash) only the max. range is [0,127]
 */
Mapper.prototype._map = function (key, limit) {

  if (!key) { throw new Error('Missing `key` to map!!'); }

  var hash = crypto.createHash('md5')
    , buf;

  hash.update(key, 'ascii');

  buf = hash.digest();

  return buf[buf.length - 1] % limit;

};


/*
 * Host part determines the group id.
 */
Mapper.prototype.group = function (urlObj) {

  var hostname = urlObj.hostname;

  //priorityze rules
  if (this.rules && hostname in this.rules) {
    return this.rules[hostname].group;
  } else {
    return this._map(hostname, this.groups.length);
  }

};

Mapper.prototype.block = function (groupIdx, urlObj) {

  var group = this.groups[groupIdx]
    , path = urlObj.path;

  return this._map(path, group.blocks);

};
