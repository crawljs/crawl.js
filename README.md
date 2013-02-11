#Crawl.js - A simple web crawler written for node.js

##Configuration
Have a look at config.json. Most keys are selfexplaining. The dot-notationis used to describe nested configuration objects.

###Storage
You can choose which storage implementation the crawler should use.

 * storage.type: starage-type (available types:<Fs, Mc, Cassandra, Hbase, Riak>)
 * storage.options: specific to the chosen type.

Some examples:

Fs. (Filesystem. (using the url as the filename))

`...  "storage": { "type": "Fs" , "options": { "dir": "./data/"}}`

Riak store.

`...  "storage": { "type": "Riak" , "options": { "host": "localhost" , "port": "8098" }}`

Mc. (Memcached protocol)

`...  "storage": { "type": "Mc" , "options": { "host": "localhost" , "port": "11211" }}`

Cassandra

`...  "storage": { "type": "Cassandra" , "options": { "keyspace":"crawljs", "hosts":['localhost:9160'] }}`

Hbase

`...  "storage": { "type": "Hbase" , "options": { "host": "localhost" , "port": "8080" }}`


##Usage
npm install

node crawl.js [url]
