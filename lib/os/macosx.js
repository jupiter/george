'use strict';
var macosx = exports;
var childProcess = require('child_process');
var async = require('async');
var settings = macosx.settings = {
  host: '127.0.0.1',
  port: '8008'
};

macosx.enableProxy = function(cb) {
  if (!process.env.SUDO_USER) {
    return cb(new Error('You need to run with root privileges to enable proxy on the OS'));
  }

  _getInterfaces(function(err, ifNames) {
    if (err) return cb(err);

    async.forEachSeries(ifNames, _enableProxyForInterface, cb);
  });
};

macosx.disableProxy = function(cb) {
  if (!process.env.SUDO_USER) {
    return cb(new Error('You need to run with root privileges to disable proxy on the OS'));
  }

  _getInterfaces(function(err, ifNames) {
    if (err) return cb(err);

    async.forEachSeries(ifNames, _disableProxyForInterface, cb);
  });
};

function _disableProxyForInterface(ifName, cb) {
  async.series([
    _command.bind(null, 'networksetup', ['-setwebproxystate', ifName, 'off']),
    _command.bind(null, 'networksetup', ['-setsecurewebproxystate', ifName, 'off']),
  ], cb);
}

function _enableProxyForInterface(ifName, cb) {
  async.series([
    _command.bind(null, 'networksetup', ['-setwebproxy', ifName, settings.host, settings.port, 'off']),
    _command.bind(null, 'networksetup', ['-setsecurewebproxy', ifName, settings.host, settings.port, 'off']),
  ], cb);
}

function _getInterfaces(cb) {
  _command('networksetup', ['-listallnetworkservices'], function(err, stdout) {
    if (err) return cb(err);

    var lines = stdout.split('\n');
    lines.shift();
    lines.pop();
    cb(null, lines);
  });
}

function _command(name, args, cb) {
  var stdout = '';
  var stderr = '';

  var child = childProcess.spawn(name, args);

  child
  .once('error', cb)
  .once('close', function() {
    cb(stderr || null, stdout);
  });

  child.stdout.on('data', function(data) {
    stdout += data;
  });

  child.stderr.on('data', function(data) {
    stderr += data;
  });
}
