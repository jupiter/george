'use strict';
var argv = require('minimist')(process.argv.slice(2), { alias: { p: 'port', d: 'destination' }});

var port = argv.port || 8008;
var destinationPath = argv.destination;

if (!destinationPath) {
  console.error('you must specify a path, e.g. `-p /tmp`')
  process.exit(1);
}

var fs = require('fs');
var path = require('path');
var macosx = require('./lib/os/macosx');
var ProxyServer = require('./lib/ProxyServer');

macosx.settings.port = port;
macosx.enableProxy(function(err) {
  if (err) {
    console.error(err);
    return process.exit(1);
  }

  console.log('proxy enabled');
});

var proxy = new ProxyServer();

proxy.server.listen(argv.p || 8008);


proxy.on('request', function(meta, body) {
  fs.writeFile(path.join(destinationPath, meta.id + '-req-head.txt'), meta.openingStr + meta.rawHeadersStr, _noop);

  var ws = fs.createWriteStream(path.join(destinationPath, meta.id + '-req-body.raw'));
  body.pipe(ws);
});

proxy.on('response', function(meta, body) {
  fs.writeFile(path.join(destinationPath, meta.id + '-res-head.txt'), meta.openingStr + meta.rawHeadersStr, _noop);

  var ws = fs.createWriteStream(path.join(destinationPath, meta.id + '-res-body.raw'));
  body.pipe(ws);
});

function disableProxy() {
  macosx.disableProxy(function(err) {
    if (err) {
      console.error(err);
      return process.exit(1);
    }

    console.log('proxy disabled');
    process.exit();
  });
}
process.on('SIGINT', disableProxy);
process.on('SIGTERM', disableProxy);

function _noop() {}
