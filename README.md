# George

A proxy for capturing local HTTP traffic

## Inspiration

Charles (http://www.charlesproxy.com), a web debugging proxy that has saved me
loads of time. It is clunky though.

## Features

This is currently still a proof of concept that:
- assumes you're using Mac OSX
- creates a proxy on a high port (default: 8008) and enables this proxy system-wide
- saves a copy of all un-secured (HTTP) traffic to the specified directory
- proxies secure (HTTPS) traffic without inspection

## To run

```
$ npm install george -g
george -d /tmp/george
```

## To Do

- Tests
- Refactored recorder (alternative outputs)
- UI (using Node Webkit)
- Config from file
- Mocks
- Rewrites
- Secure capture / mocks / rewrites

## License

ISC
