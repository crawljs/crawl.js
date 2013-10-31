
/**
 * Console logging.
 * TODO introduce logging lib.
 */

function format(out) {
  return function () {
    arguments[0] = '[' + new Date().toISOString() + '] ' + arguments[0];
    out.apply(this, arguments);
  };
}

function noop () {}

exports.debug = noop;
exports.info  = format(console.log);
exports.warn  = format(console.error);
exports.error = format(console.error);

