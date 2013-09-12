var Store = require('../store').Store
  , util = require('util');

function Dummy() {}

util.inherits(Dummy, Store);

Dummy.prototype.put = function () {
  //cool, I dont have to do anything ;-)
};

module.exports = Dummy;
