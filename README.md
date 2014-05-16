#Crawl.js - A decentralized crawler for node.js
A crawl.js instance is autonomic and responsible for one URL-block. URL-blocks are 'sorted sets' (redis.io) used as queues.

##Prerequisites

* Node.js (v0.10.x) - http://nodejs.org/
* Redis.io - http://redis.io/

Note: I suggest the use of `nvm` (Node Version Manager - https://github.com/creationix/nvm) for the Node.js installation. Because crawl.js requires version v0.10.x and most distributions do not have packages for this yet.

##Configuration
Have a look at `/config.json`. The following parts are important and need to be adjusted. 

* `queues.remote`: Configure it, so that the instances can connect to redis.
* `seen`: Typically same as `queues.remote`
* `mapper`: How to map URLs to groups and blocks. One crawl.js instance is responsible for exactly one block within one group. Default configuration is 1 group with 1 block.

##Preperations
Before we start to crawl we need to import some URL's into the URL-blocks.

```Shell
$ ./tools/importer <path to seed-urls.txt>
```

The format of `seed-urls.txt` is pretty simple:

```Shell
http://www.someurl.ch
http://www.anotherurl.ch
```

##Dependencies
Before we can start an instance we need to install the dependencies. They are configured in `/package.json`.
To install them just do:
```Shell
$ cd project-root
$ npm install
```

##Starting an instance
```Shell
$ node crawl.js <group> <block>
```
