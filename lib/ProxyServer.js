var util = require('util');
var net = require('net');
var http = require('http');
var url = require('url');
var EventEmitter = require('events').EventEmitter;
var httpProxy = require('http-proxy');
var id = require('bson').ObjectId;

var ProxyServer = function ProxyServer(config, server) {
  this.config = config;
  this.httpProxy = null;
  this.server = server || http.createServer();

  this.init();
};
util.inherits(ProxyServer, EventEmitter);

var proxy = ProxyServer.prototype;

proxy.init = function() {
  var self = this;
  var server = self.server;

  server.on('request', function(req, res) {
    console.log(req.method, 'http://' + req.headers.host);

    var meta = {
      id: id(),
      openingStr: req.method + ' ' + _pathStr(req.url) + ' HTTP/' + req.httpVersion + '\n',
      rawHeadersStr: (req.rawHeaders) ? _rawHeadersToStr(req.rawHeaders) : _headersToStr(req.headers)
    };

    req._proxyId = meta.id;

    self.emit('request', meta, req);
    self.httpProxy.web(req, res, { target: 'http://' + req.headers.host });
  });

  server.on('connect', function(req, cltSocket, head) {
    console.log(req.method, 'http://' + req.url);

    var srvUrl = url.parse('http://' + req.url);
    var srvSocket = net.connect(srvUrl.port, srvUrl.hostname, function() {
      cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                      'Proxy-agent: Node-Proxy\r\n' +
                      '\r\n');
      srvSocket.write(head);
      srvSocket.pipe(cltSocket);
      cltSocket.pipe(srvSocket);
    }).on('error', console.error);
  });

  self.httpProxy = httpProxy.createProxyServer();
  self.httpProxy.on('error', console.error);
  self.httpProxy.on('proxyRes', function(proxyRes, req, res) {
    var meta = {
      id: req._proxyId,
      openingStr: 'HTTP/' + proxyRes.httpVersion + ' ' + proxyRes.statusCode + ' ' + http.STATUS_CODES[proxyRes.statusCode] + '\n',
      rawHeadersStr: (proxyRes.rawHeaders) ? _rawHeadersToStr(proxyRes.rawHeaders) : _headersToStr(proxyRes.headers)
    };

    self.emit('response', meta, proxyRes);
  });

  return this;
};

var RAW_HEADER_DELIMITERS = [': ', '\n'];
function _rawHeadersToStr(arr) {
  var output = '';
  var i = -1;
  var part;
  while (part = arr[++i]) {
    output += part + RAW_HEADER_DELIMITERS[i % 2];
  }
  return output;
}

function _headersToStr(obj) {
  var output = '';
  var keys = Object.keys(obj);
  var i = -1;
  var key;
  while (key = keys[++i]) {
    output += key + ': ' + obj[key] + '\n';
  }
  return output;
}

var HTTP_URL_PREFIX_REGEX = /^https?:\/\/[^\/]+/;
function _pathStr(url) {
  return url.replace(HTTP_URL_PREFIX_REGEX, '');
}

module.exports = ProxyServer;
