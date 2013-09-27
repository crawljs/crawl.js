var log = require('../logger')
  , util = require('util');

function Dummy(name, options) {
  log.info('[store.dummy %s] created', name);
}

Dummy.prototype.put = function () {
  //cool, I dont have to do anything ;-)
};

module.exports = Dummy;
