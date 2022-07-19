# lookpath

[![npm version](https://badge.fury.io/js/lookpath.svg)](https://badge.fury.io/js/lookpath)
[![npm download](https://img.shields.io/npm/dt/lookpath.svg)](https://www.npmjs.com/package/lookpath)
[![Node.js CI](https://github.com/otiai10/lookpath/workflows/Node.js%20CI/badge.svg)](https://github.com/otiai10/lookpath/actions/)
[![codecov](https://codecov.io/gh/otiai10/lookpath/branch/master/graph/badge.svg)](https://codecov.io/gh/otiai10/lookpath)
[![Maintainability](https://api.codeclimate.com/v1/badges/1cc9237695a7bd8e3d60/maintainability)](https://codeclimate.com/github/otiai10/lookpath/maintainability)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fotiai10%2Flookpath.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fotiai10%2Flookpath?ref=badge_shield)

To check if the command exists and where the executable file is, **WITHOUT** using `child_process`.

```
npm install lookpath
```

# Example usage

```js
const { lookpath } = require('lookpath');

const p = await lookpath('bash');
// "/bin/bash", otherwise "undefined"
```

# Advanced usage

```js
const p = await lookpath('bash', {
  include: ['/home/hiromu/.bin'],
  exclude: ['/mnt']
});
// include: Do scan also under `~/.bin`
// exclude: Do NOT scan under `/mnt`
```

# Motivation

- I don't want to spawn `child_process` in order to kick `which`, `where`, `whereis`, or `command -v`.
    - [node.js - Node - check existence of command in path - Stack Overflow](https://stackoverflow.com/questions/34953168/node-check-existence-of-command-in-path/)
    - [Node.js: Check if a command exists - Gist](https://gist.github.com/jmptable/7a3aa580efffdef50fa9f0dd3d068d6f)
    - [mathisonian/command-exists: node module to check if a command-line command exists - GitHub](https://github.com/mathisonian/command-exists)
- then I checked Go implementation of [`exec.LookPath`](https://golang.org/pkg/os/exec/#LookPath).
    - [src/os/exec/lp_unix.go - The Go Programming Language](https://golang.org/src/os/exec/lp_unix.go?s=928:970#L24)
- so I concluded that scanning under `$PATH` or `$Path` is the best straightforward way to check if the command exists.


# Issues

- https://github.com/otiai10/lookpath/issues

Any feedback would be appreciated ;)


# License

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fotiai10%2Flookpath.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fotiai10%2Flookpath?ref=badge_large)