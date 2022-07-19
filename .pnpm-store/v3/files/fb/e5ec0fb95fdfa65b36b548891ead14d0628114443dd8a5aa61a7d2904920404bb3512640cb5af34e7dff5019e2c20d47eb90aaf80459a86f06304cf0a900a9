# hex-lite [![NPM](https://img.shields.io/npm/v/hex-lite.svg)](https://npmjs.com/package/hex-lite) [![Build](https://travis-ci.org/kevlened/hex-lite.svg?branch=master)](https://travis-ci.org/kevlened/hex-lite)
isomorphic hex library in 256 bytes

## Install

`npm install hex-lite`

## Usage

```javascript
const hex = require('hex-lite')

hex.toUint8Array('000f10ff000f10')
// new Uint8Array([0,15,16,255,0,15,16])

hex.fromUint8Array(new Uint8Array([0,15,16,255,0,15,16]))
// '000f10ff000f10'

hex.toBuffer('000f10ff000f10')
// ArrayBuffer

hex.fromBuffer(new Uint8Array([0,15,16,255,0,15,16]).buffer)
// '000f10ff000f10'
```

## Can it be smaller?

If you use ES6 imports with a bundler that supports tree-shaking, yes!

```javascript
import { fromUint8Array } from 'hex-lite'
```

## I wanna go fast!

The Node implementation is just a proxy to Node's `Buffer` object to be as fast as possible. The default browser implementation optimizes for size, so if you're looking for raw speed, import like this:

```javascript
import hex from 'hex-lite/fast/hex-lite.mjs'
```

#### Perf profile

```
⏱ browser performance on 1000 arrays or strings of size 10003:
hex.fromUint8Array: 810.422ms
hex.toUint8Array: 743.903ms
hex.fromBuffer: 798.264ms
hex.toBuffer: 584.592ms

⏱ fast browser performance on 1000 arrays or strings of size 10003:
hex.fromUint8Array: 222.453ms
hex.toUint8Array: 237.905ms
hex.fromBuffer: 223.078ms
hex.toBuffer: 231.342ms

⏱ node performance on 1000 arrays or strings of size 10003:
hex.fromUint8Array: 26.802ms
hex.toUint8Array: 32.461ms
hex.fromBuffer: 25.326ms
hex.toBuffer: 35.421ms
```

## License

MIT
