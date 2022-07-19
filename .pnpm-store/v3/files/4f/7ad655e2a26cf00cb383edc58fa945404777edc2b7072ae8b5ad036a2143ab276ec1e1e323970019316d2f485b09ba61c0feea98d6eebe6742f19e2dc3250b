/* eslint-disable no-undef */
/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This is the entry point for [browserify](http://browserify.org/) to build
// the bundled version. The bundled version provides access to the
//   - convert, encode and decode functions
//   - transformers, the actual transformation functions
//   - node.js Buffer global object
(function webExports() {
  const converter = require('./converter');
  globalThis.apgConv = {
    convert: converter.convert,
    encode: converter.encode,
    decode: converter.decode,
    transformers: require('./transformers'),
    // eslint-disable-next-line object-shorthand
    Buffer: Buffer,
  };
})();
