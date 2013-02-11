
var fs = require('fs')
  , log = require('./logger')
  , cache; //cache parsed config object


function config () {

  if (cache) {
    return cache;
  }

  var path = process.cwd() + '/config.json'
    , content;

  //load and merge object
  content = fs.readFileSync(path, 'utf-8');

  try {
    cache = JSON.parse(content);
    log.info('config file ' + path + ' loaded.');
  } catch(e) {
    log.error('could not parse config file: ' + path);
    throw e;
  }

  return cache;

}

module.exports = config;
