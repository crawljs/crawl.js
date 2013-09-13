/*
 * The extractor is responsible for extracting new URLs out of html documents downloaded by the `fetcher`.
 * We implement the Stream interface and therefore the engines can extract URLs as soon as the fetcher emits `data` events. (We can start parsing even before the whole document is fetched)
 *
 * Different engines available:
 * 
 * - regex: uses regular expressions to do the work
 * - parser: uses a binding to the popular c library libxml.
 *
 * An engine calls Extractor.prototype.found for every found URL.
 */
var stream = require('stream')
  , url = require('./url')
  , log = require('./logger')
  , conf = require('./config')()
  , Dispatcher = require('./dispatcher')
  , util = require('util');

function Extractor (name) {

  log.info('[extractor %s] creating type: %s', name, conf.extractor);

  //Stream Api
  stream.Stream.call(this);
  this.writable = true;
  this.name = name;
  this.dispatcher = new Dispatcher();
}


//we are a Stream
util.inherits(Extractor, stream.Stream);

//Engines call this when they find an url
Extractor.prototype.found = function (urlObj) {
  this.dispatcher.dispatch(urlObj, false);
};

Extractor.prototype.setBaseUrl = function (urlString) {
  this.url = urlString;
  this.urlObj = url.parse(urlString);
};

//init engines
//Regex implementation
//Sax Parser (https://github.com/fb55/node-htmlparser)

//engines needs to access constructor
exports.Extractor = Extractor;
Extractor.engines = {};

['regex', 'parser'].forEach(function (engine) {
  Extractor.engines[engine] = require('./extractors/' + engine);
});

//public api
module.exports = function (name) {
  return new Extractor.engines[conf.extractor](name);
};
