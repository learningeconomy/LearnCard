'use strict';

// Bundle-only replacement for `emphasize` (see scripts/build.ts).
// The stock entry registers ~190 highlight.js languages (about 1 MB minified); the REPL
// highlighter in pretty-repl only ever highlights JavaScript.
const emphasize = require('emphasize/lib/core.js');

emphasize.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'));

module.exports = emphasize;
