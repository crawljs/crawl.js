
/**
 * Console logging.
 * TODO introduce logging lib.
 */

function noop () {}

exports.debug = noop;
exports.info  = console.log;
exports.warn  = console.log;
exports.error = console.error;

