/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This module implements the `exec()` function.

'use strict;';

const funcs = require('./result');

/* turns on or off the read-only attribute of the `last result` properties of the object */
const setProperties = function seProperties(p, readonly) {
  const exp = p.thisThis;
  const prop = {
    writable: readonly,
    enumerable: false,
    configurable: true,
  };
  Object.defineProperty(exp, 'input', prop);
  Object.defineProperty(exp, 'leftContext', prop);
  Object.defineProperty(exp, 'lastMatch', prop);
  Object.defineProperty(exp, 'rightContext', prop);
  Object.defineProperty(exp, '$_', prop);
  Object.defineProperty(exp, '$`', prop);
  Object.defineProperty(exp, '$&', prop);
  Object.defineProperty(exp, "$'", prop);
  prop.enumerable = true;
  Object.defineProperty(exp, 'rules', prop);
  if (!exp.rules) {
    exp.rules = [];
  }
  for (const name in exp.rules) {
    const des = `\${${name}}`;
    Object.defineProperty(exp, des, prop);
    Object.defineProperty(exp.rules, name, prop);
  }
};
/* generate the results object for JavaScript strings */
const sResult = function sResult(p) {
  const ret = {
    index: p.result.index,
    length: p.result.length,
    input: p.charsToString(p.chars, 0),
    treeDepth: p.result.treeDepth,
    nodeHits: p.result.nodeHits,
    rules: [],
    toText() {
      return funcs.s.resultToText(this);
    },
    toHtml() {
      return funcs.s.resultToHtml(this);
    },
    toHtmlPage() {
      return funcs.s.resultToHtmlPage(this);
    },
  };
  ret[0] = p.charsToString(p.chars, p.result.index, p.result.length);
  /* each rule is either 'undefined' or an array of phrases */
  for (const name in p.result.rules) {
    const rule = p.result.rules[name];
    if (rule) {
      ret.rules[name] = [];
      for (let i = 0; i < rule.length; i += 1) {
        ret.rules[name][i] = {
          index: rule[i].index,
          phrase: p.charsToString(p.chars, rule[i].index, rule[i].length),
        };
      }
    } else {
      ret.rules[name] = undefined;
    }
  }
  return ret;
};
/* generate the results object for integer arrays of character codes */
const uResult = function uResult(p) {
  const { chars } = p;
  const { result } = p;
  let beg;
  let end;
  const ret = {
    index: result.index,
    length: result.length,
    input: chars.slice(0),
    treeDepth: result.treeDepth,
    nodeHits: result.nodeHits,
    rules: [],
    toText(mode) {
      return funcs.u.resultToText(this, mode);
    },
    toHtml(mode) {
      return funcs.u.resultToHtml(this, mode);
    },
    toHtmlPage(mode) {
      return funcs.u.resultToHtmlPage(this, mode);
    },
  };
  beg = result.index;
  end = beg + result.length;
  ret[0] = chars.slice(beg, end);
  /* each rule is either 'undefined' or an array of phrases */
  for (const name in result.rules) {
    const rule = result.rules[name];
    if (rule) {
      ret.rules[name] = [];
      for (let i = 0; i < rule.length; i += 1) {
        beg = rule[i].index;
        end = beg + rule[i].length;
        ret.rules[name][i] = {
          index: beg,
          phrase: chars.slice(beg, end),
        };
      }
    } else {
      ret.rules[name] = undefined;
    }
  }
  return ret;
};
/* generate the apg-exp properties or "last match" object for JavaScript strings */
const sLastMatch = function sLastMatch(p, result) {
  const exp = p.thisThis;
  let temp;
  // eslint-disable-next-line prefer-destructuring
  exp.lastMatch = result[0];
  temp = p.chars.slice(0, result.index);
  exp.leftContext = p.charsToString(temp);
  temp = p.chars.slice(result.index + result.length);
  exp.rightContext = p.charsToString(temp);
  exp.input = result.input.slice(0);
  // eslint-disable-next-line no-underscore-dangle
  exp.$_ = exp.input;
  exp['$&'] = exp.lastMatch;
  exp['$`'] = exp.leftContext;
  exp["$'"] = exp.rightContext;
  exp.rules = {};
  for (const name in result.rules) {
    const rule = result.rules[name];
    if (rule) {
      exp.rules[name] = rule[rule.length - 1].phrase;
    } else {
      exp.rules[name] = undefined;
    }
    exp[`\${${name}}`] = exp.rules[name];
  }
};
/* generate the apg-exp properties or "last match" object for integer arrays of character codes */
const uLastMatch = function uLastMatch(p, result) {
  const exp = p.thisThis;
  const { chars } = p;
  let beg;
  beg = 0;
  const end = beg + result.index;
  exp.leftContext = chars.slice(beg, end);
  exp.lastMatch = result[0].slice(0);
  beg = result.index + result.length;
  exp.rightContext = chars.slice(beg);
  exp.input = result.input.slice(0);
  // eslint-disable-next-line no-underscore-dangle
  exp.$_ = exp.input;
  exp['$&'] = exp.lastMatch;
  exp['$`'] = exp.leftContext;
  exp["$'"] = exp.rightContext;
  exp.rules = {};
  for (const name in result.rules) {
    const rule = result.rules[name];
    if (rule) {
      exp.rules[name] = rule[rule.length - 1].phrase;
    } else {
      exp.rules[name] = undefined;
    }
    exp[`\${${name}}`] = exp.rules[name];
  }
};
/* set the returned result properties, and the `last result` properties of the object */
const setResult = function setResult(p, parserResult) {
  let result;
  p.result = {
    index: parserResult.index,
    length: parserResult.length,
    treeDepth: parserResult.treeDepth,
    nodeHits: parserResult.nodeHits,
    rules: [],
  };
  /* set result in APG phrases {phraseIndex, phraseLength} */
  /* p.ruleNames are all names in the grammar */
  /* p.thisThis.ast.callbacks[name] only defined for 'included' rule names */
  const obj = p.parser.ast.phrases();
  for (const name in p.thisThis.ast.callbacks) {
    // const cap = p.ruleNames[name];
    if (p.thisThis.ast.callbacks[name]) {
      const cap = p.ruleNames[name];
      if (Array.isArray(obj[cap])) {
        p.result.rules[cap] = obj[cap];
      } else {
        p.result.rules[cap] = undefined;
      }
    }
  }
  /* p.result now has everything we need to know about the result of exec() */
  /* generate the Unicode or JavaScript string version of the result & last match objects */
  setProperties(p, true);
  if (p.thisThis.unicode) {
    result = uResult(p);
    uLastMatch(p, result);
  } else {
    result = sResult(p);
    sLastMatch(p, result);
  }
  setProperties(p, false);
  return result;
};

/* create an unsuccessful parser result object */
const resultInit = function resultInit() {
  return {
    success: false,
  };
};

/* create a successful parser result object */
const resultSuccess = function resultSuccess(index, parserResult) {
  return {
    success: true,
    index,
    length: parserResult.matched,
    treeDepth: parserResult.maxTreeDepth,
    nodeHits: parserResult.nodeHits,
  };
};
/* search forward from `lastIndex` until a match is found or the end of string is reached */
const forward = function forward(p) {
  let result = resultInit();
  for (let i = p.thisThis.lastIndex; i < p.chars.length; i += 1) {
    const re = p.parser.parseSubstring(p.grammarObject, 0, p.chars, i, p.chars.length - i);
    if (p.match(re.state)) {
      result = resultSuccess(i, re);
      break;
    }
  }
  return result;
};
/* reset lastIndex after a search */
const setLastIndex = function setLastIndex(lastIndex, flag, parserResult) {
  if (flag) {
    if (parserResult.success) {
      let ret = parserResult.index;
      /* bump-along mode - increment is never zero */
      ret += parserResult.length > 0 ? parserResult.length : 1;
      return ret;
    }
    return 0;
  }
  return lastIndex;
};
/* attempt a match at lastIndex only - does look further if a match is not found */
const anchor = function anchor(p) {
  let result = resultInit();
  if (p.thisThis.lastIndex < p.chars.length) {
    const re = p.parser.parseSubstring(
      p.grammarObject,
      0,
      p.chars,
      p.thisThis.lastIndex,
      p.chars.length - p.thisThis.lastIndex
    );
    if (p.match(re.state)) {
      result = resultSuccess(p.thisThis.lastIndex, re);
    }
  }
  return result;
};
/* called by exec() for a forward search */
exports.execForward = function execForward(p) {
  const parserResult = forward(p);
  let result = null;
  if (parserResult.success) {
    result = setResult(p, parserResult);
  }
  p.thisThis.lastIndex = setLastIndex(p.thisThis.lastIndex, p.thisThis.global, parserResult);
  return result;
};
/* called by exec() for an anchored search */
exports.execAnchor = function execAnchor(p) {
  const parserResult = anchor(p);
  let result = null;
  if (parserResult.success) {
    result = setResult(p, parserResult);
  }
  p.thisThis.lastIndex = setLastIndex(p.thisThis.lastIndex, p.thisThis.sticky, parserResult);
  return result;
};
/* search forward from lastIndex looking for a match */
exports.testForward = function testForward(p) {
  const parserResult = forward(p);
  p.thisThis.lastIndex = setLastIndex(p.thisThis.lastIndex, p.thisThis.global, parserResult);
  return parserResult.success;
};
/* test for a match at lastIndex only, do not look further if no match is found */
exports.testAnchor = function testAnchor(p) {
  const parserResult = anchor(p);
  p.thisThis.lastIndex = setLastIndex(p.thisThis.lastIndex, p.thisThis.sticky, parserResult);
  return parserResult.success;
};
