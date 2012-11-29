
/**
 * Console logging for now.
 */

function noop () {}

exports.debug = noop;
exports.info  = console.log;
exports.warn  = console.log;
exports.error = console.error;

