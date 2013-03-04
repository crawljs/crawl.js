
var url = require('url')
  , fs = require('fs');

function readUrls() {
  var mark = /!###/
    , data = {}
    , count = 0
    , base
    , contents = fs.readFileSync('urls.txt','utf-8');

  contents.split('\n').forEach(function (line) {
    if (mark.test(line)) {
      //base url
      base = line.replace(mark, '');
      data[base] = [];
    } else {
      //href found on `base url`
      data[base].push(line);
      count++;
    }
  });

  data.count = count;

  return data;
}

/*
 * Use-Case for reloving links on a big page (1000 links)
 */
function benchUrlResolveSimple() {
  var count = 1000
    , start = Date.now();

  for (var i = 0; i < count; i++) {
    url.resolveObject('http://www.example.com/one/two', 'three/four/');
  }

  console.log('resolving %s links from 1 page took %s seconds', count, (Date.now() - start)/1000);
}

/*
 * Use-Case for reloving links on a big page (1000 links)
 * Requires node v.9.x
 */
function benchUrlResolveSimple2() {
  var count = 1000
    , start = Date.now()
    , base  = url.parse('http://www.example.com/one/two');

  if(!base.resolve) { console.log('Node v0.9.x required'); return;}

  for(var i = 0; i < count; i++) {
    base.resolveObject('three/four/');
  }

  console.log('resolving %s links from 1 page took %s seconds. (node 0.9.x)', count, (Date.now() - start)/1000);

}

function benchUrlResolveReal() {
  //real world data
  var data = readUrls()
    , count = data.count
    , start = Date.now();

  delete data.count

  for (var base in data) {
    var hrefs = data[base];
    hrefs.forEach(function (href) {
      url.resolveObject(base, href);
    });
  }

  console.log('resolving %s links from %s pages took %s seconds (node v0.8.x)', count, Object.keys(data).length, (Date.now() - start)/1000);
}

function benchUrlResolveReal2() {
  //real world data
  var data = readUrls()
    , count = data.count
    , start = Date.now();

  delete data.count

  for (var base in data) {
    var hrefs = data[base];
    var baseUrl = url.parse(base);
    if(!baseUrl.resolve) { console.log('Node v0.9.x required'); return;}
    hrefs.forEach(function (href) {
      baseUrl.resolveObject(href);
    });
  }

  console.log('resolving %s links from %s pages took %s seconds (node v0.9.x) :-))))))))', count, Object.keys(data).length, (Date.now() - start)/1000);
}

benchUrlResolveSimple();
benchUrlResolveSimple2();
benchUrlResolveReal();
benchUrlResolveReal2();
