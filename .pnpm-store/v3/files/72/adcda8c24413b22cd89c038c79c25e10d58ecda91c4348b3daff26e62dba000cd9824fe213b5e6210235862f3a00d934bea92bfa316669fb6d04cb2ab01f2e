/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This module reads the input grammar file and does a preliminary analysis
// before attempting to parse it into a grammar object.
// See:<br>
// `./dist/scanner-grammar.bnf`<br>
// for the grammar file this parser is based on.
//
// It has two primary functions.
// - verify the character codes - no non-printing ASCII characters
// - catalog the lines - create an array with a line object for each line.
// The object carries information about the line number and character length which is used
// by the parser generator primarily for error reporting.
module.exports = function exfn(chars, errors, strict, trace) {
  const thisFileName = 'scanner.js: ';
  const apglib = require('../apg-lib/node-exports');
  const grammar = new (require('./scanner-grammar'))();
  const { callbacks } = require('./scanner-callbacks');

  /* Scan the grammar for character code errors and catalog the lines. */
  const lines = [];
  // eslint-disable-next-line new-cap
  const parser = new apglib.parser();
  // eslint-disable-next-line new-cap
  parser.ast = new apglib.ast();
  parser.ast.callbacks = callbacks;
  if (trace) {
    if (trace.traceObject !== 'traceObject') {
      throw new TypeError(`${thisFileName}trace argument is not a trace object`);
    }
    parser.trace = trace;
  }

  /* parse the input SABNF grammar */
  const test = parser.parse(grammar, 'file', chars);
  if (test.success !== true) {
    errors.push({
      line: 0,
      char: 0,
      msg: 'syntax analysis error analyzing input SABNF grammar',
    });
    return;
  }
  const data = {
    lines,
    lineNo: 0,
    errors,
    strict: !!strict,
  };

  /* translate (analyze) the input SABNF grammar */
  parser.ast.translate(data);
  // eslint-disable-next-line consistent-return
  return lines;
};
