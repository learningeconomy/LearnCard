/* eslint-disable no-restricted-syntax */
/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This module implements the `replace()` function.

'use strict;';

const errorName = 'apg-exp: replace(): ';
const parseReplacementString = require('./parse-replacement');
/* replace special replacement patterns, `$&`, etc. */
const generateReplacementString = function generateReplacementString(p, rstr, items) {
  const exp = p.thisThis;
  if (items.length === 0) {
    /* no special characters in the replacement string */
    /* just return a copy of the replacement string */
    return rstr;
  }
  let replace = rstr.slice(0);
  let first;
  let last;
  let ruleName;
  items.reverse();
  items.forEach((item) => {
    first = replace.slice(0, item.index);
    last = replace.slice(item.index + item.length);
    switch (item.type) {
      case 'escape':
        replace = first.concat('$', last);
        break;
      case 'prefix':
        replace = first.concat(exp.leftContext, last);
        break;
      case 'match':
        replace = first.concat(exp.lastMatch, last);
        break;
      case 'suffix':
        replace = first.concat(exp.rightContext, last);
        break;
      case 'name':
        /* If there are multiple matches to this rule name, only the last is used */
        /* If this is a problem, modify the grammar and use different rule names for the different places. */
        ruleName = p.ruleNames[item.name.nameString];
        replace = first.concat(exp.rules[ruleName], last);
        break;
      default:
        throw new Error(`${errorName}generateREplacementString(): unrecognized item type: ${item.type}`);
    }
  });
  return replace;
};
/* creates a special object with the apg-exp object's "last match" properites */
const lastObj = function lastObj(exp) {
  const obj = {};
  obj.ast = exp.ast;
  obj.input = exp.input;
  obj.leftContext = exp.leftContext;
  obj.lastMatch = exp.lastMatch;
  obj.rightContext = exp.rightContext;
  // eslint-disable-next-line no-underscore-dangle
  obj.$_ = exp.input;
  obj['$`'] = exp.leftContext;
  obj['$&'] = exp.lastMatch;
  obj["$'"] = exp.rightContext;
  obj.rules = [];
  // eslint-disable-next-line no-restricted-syntax
  // eslint-disable-next-line guard-for-in
  for (const name in exp.rules) {
    const el = `\${${name}}`;
    obj[el] = exp[el];
    obj.rules[name] = exp.rules[name];
  }
  return obj;
};
/* call the user's replacement function for a single pattern match */
const singleReplaceFunction = function singleReplaceFunction(p, ostr, func) {
  const result = p.thisThis.exec(ostr);
  if (result === null) {
    return ostr;
  }
  const rstr = func(result, lastObj(p.thisThis));
  const ret = p.thisThis.leftContext.concat(rstr, p.thisThis.rightContext);
  return ret;
};
/* call the user's replacement function to replace all pattern matches */
const globalReplaceFunction = function globalReplaceFunction(p, ostr, func) {
  const exp = p.thisThis;
  let retstr = ostr.slice(0);
  const TRUE = true;
  while (TRUE) {
    const result = exp.exec(retstr);
    if (result === null) {
      break;
    }
    const newrstr = func(result, lastObj(exp));
    retstr = exp.leftContext.concat(newrstr, exp.rightContext);
    exp.lastIndex = exp.leftContext.length + newrstr.length;
    if (result[0].length === 0) {
      /* an empty string IS a match and is replaced */
      /* but use "bump-along" mode to prevent infinite loop */
      exp.lastIndex += 1;
    }
  }
  return retstr;
};
/* do a single replacement with the caller's replacement string */
const singleReplaceString = function singleReplaceString(p, ostr, rstr) {
  const exp = p.thisThis;
  const result = exp.exec(ostr);
  if (result === null) {
    return ostr;
  }
  const ritems = parseReplacementString(p, rstr);
  const rep = generateReplacementString(p, rstr, ritems);
  const ret = exp.leftContext.concat(rep, exp.rightContext);
  return ret;
};
/* do a global replacement of all matches with the caller's replacement string */
const globalReplaceString = function globalReplaceString(p, ostr, rstr) {
  const exp = p.thisThis;
  let retstr = ostr.slice(0);
  let ritems = null;
  const TRUE = true;
  while (TRUE) {
    const result = exp.exec(retstr);
    if (result == null) {
      break;
    }
    if (ritems === null) {
      ritems = parseReplacementString(p, rstr);
    }
    const newrstr = generateReplacementString(p, rstr, ritems);
    retstr = exp.leftContext.concat(newrstr, exp.rightContext);
    exp.lastIndex = exp.leftContext.length + newrstr.length;
    if (result[0].length === 0) {
      /* an empty string IS a match and is replaced */
      /* but use "bump-along" mode to prevent infinite loop */
      exp.lastIndex += 1;
    }
  }
  return retstr;
};
/* the replace() function calls this to replace the matched patterns with a string */
exports.replaceString = function replaceString(p, str, replacement) {
  if (p.thisThis.global || p.thisThis.sticky) {
    return globalReplaceString(p, str, replacement);
  }
  return singleReplaceString(p, str, replacement);
};
/* the replace() function calls this to replace the matched patterns with a function */
exports.replaceFunction = function replaceFunction(p, str, func) {
  if (p.thisThis.global || p.thisThis.sticky) {
    return globalReplaceFunction(p, str, func);
  }
  return singleReplaceFunction(p, str, func);
};
