/* eslint-disable new-cap */
/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This module will parse the replacement string and locate any special replacement characters.

'use strict;';

const errorName = 'apgex: replace(): ';
const synError = function synError(result, chars, phraseIndex, data) {
  if (data.isMatch(result.state)) {
    const value = data.charsToString(chars, phraseIndex, result.phraseLength);
    data.items.push({ type: 'error', index: phraseIndex, length: result.phraseLength, error: value });
    data.errors += 1;
    data.count += 1;
  }
};
const synEscape = function synExcape(result, chars, phraseIndex, data) {
  if (data.isMatch(result.state)) {
    data.items.push({ type: 'escape', index: phraseIndex, length: result.phraseLength });
    data.escapes += 1;
    data.count += 1;
  }
};
const synMatch = function synMatch(result, chars, phraseIndex, data) {
  if (data.isMatch(result.state)) {
    data.items.push({ type: 'match', index: phraseIndex, length: result.phraseLength });
    data.matches += 1;
    data.count += 1;
  }
};
const synPrefix = function synPrefix(result, chars, phraseIndex, data) {
  if (data.isMatch(result.state)) {
    data.items.push({ type: 'prefix', index: phraseIndex, length: result.phraseLength });
    data.prefixes += 1;
    data.count += 1;
  }
};
const synSuffix = function synSuffix(result, chars, phraseIndex, data) {
  if (data.isMatch(result.state)) {
    data.items.push({ type: 'suffix', index: phraseIndex, length: result.phraseLength });
    data.suffixes += 1;
    data.count += 1;
  }
};
const synXName = function synXName(result, chars, phraseIndex, data) {
  if (data.isMatch(result.state)) {
    data.items.push({ type: 'name', index: phraseIndex, length: result.phraseLength, name: data.name });
    data.names += 1;
    data.count += 1;
  }
};
const synName = function synName(result, chars, phraseIndex, data) {
  if (data.isMatch(result.state)) {
    const nameStr = data.charsToString(chars, phraseIndex, result.phraseLength);
    const nameChars = chars.slice(phraseIndex, phraseIndex + result.phraseLength);
    data.name = { nameString: nameStr, nameChars };
  }
};
module.exports = function parseReplacement(p, str) {
  const grammar = new (require('./replace-grammar'))();
  const apglib = require('../apg-lib/node-exports');
  const parser = new apglib.parser();
  const data = {
    name: '',
    count: 0,
    errors: 0,
    escapes: 0,
    prefixes: 0,
    matches: 0,
    suffixes: 0,
    names: 0,
    isMatch: p.match,
    charsToString: apglib.utils.charsToString,
    items: [],
  };
  parser.callbacks.error = synError;
  parser.callbacks.escape = synEscape;
  parser.callbacks.prefix = synPrefix;
  parser.callbacks.match = synMatch;
  parser.callbacks.suffix = synSuffix;
  parser.callbacks.xname = synXName;
  parser.callbacks.name = synName;
  const chars = apglib.utils.stringToChars(str);
  const result = parser.parse(grammar, 0, chars, data);
  if (!result.success) {
    throw new Error(`${errorName}unexpected error parsing replacement string`);
  }
  const ret = data.items;
  if (data.errors > 0) {
    let msg = '[';
    let i = 0;
    let e = 0;
    for (; i < data.items.length; i += 1) {
      const item = data.items[i];
      if (item.type === 'error') {
        if (e > 0) {
          msg += `, ${item.error}`;
        } else {
          msg += item.error;
        }
        e += 1;
      }
    }
    msg += ']';
    throw new Error(`${errorName}special character sequences ($...) errors: ${msg}`);
  }
  if (data.names > 0) {
    const badNames = [];
    let i = 0;
    for (; i < data.items.length; i += 1) {
      const item = data.items[i];
      if (item.type === 'name') {
        const name = item.name.nameString;
        const lower = name.toLowerCase();
        if (!p.parser.ast.callbacks[lower]) {
          /* name not in callback list, either a bad rule name or an excluded rule name */
          badNames.push(name);
        }
        /* convert all item rule names to lower case */
        item.name.nameString = lower;
      }
    }
    if (badNames.length > 0) {
      let msg = '[';
      for (let ii = 0; ii < badNames.length; ii += 1) {
        if (ii > 0) {
          msg += `, ${badNames[ii]}`;
        } else {
          msg += badNames[ii];
        }
      }
      msg += ']';
      throw new Error(`${errorName}special character sequences \${name}: names not found: ${msg}`);
    }
  }
  return ret;
};
