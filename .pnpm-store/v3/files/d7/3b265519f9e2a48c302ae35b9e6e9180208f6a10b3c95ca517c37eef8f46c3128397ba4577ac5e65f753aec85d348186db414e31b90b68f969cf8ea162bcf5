/* eslint-disable no-underscore-dangle */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This module defines all of the display functions. Text and HTML displays of
// the grammar source, the result object and the `apg-exp` "last match" object.

'use strict;';

const apglib = require('../apg-lib/node-exports');

// const utils = apglib.utils;
// const style = apglib.style;
const { utils, style } = apglib;
const MODE_HEX = 16;
const MODE_DEC = 10;
const MODE_ASCII = 8;
const MODE_UNICODE = 32;
/* add style to HTML phrases */
const phraseStyle = function phraseStyle(phrase, styleArg) {
  if (phrase === '') {
    return `<span class="${style.CLASS_EMPTY}">&#120634;</span>`;
  }
  if (phrase === undefined) {
    return `<span class="${style.CLASS_REMAINDER}">undefined</span>`;
  }
  let classStyle = style.CLASS_REMAINDER;
  if (typeof styleArg === 'string') {
    if (styleArg.toLowerCase() === 'match') {
      classStyle = style.CLASS_MATCH;
    } else if (styleArg.toLowerCase() === 'nomatch') {
      classStyle = style.CLASS_NOMATCH;
    }
  }
  const chars = apglib.utils.stringToChars(phrase);
  let html = `<span class="${classStyle}">`;
  html += apglib.utils.charsToAsciiHtml(chars);
  return `${html}</span>`;
};
/* result object - string phrases to ASCII text */
const sResultToText = function sResultToText(result) {
  let txt = '';
  txt += '    result:\n';
  txt += '       [0]: ';
  txt += result[0];
  txt += '\n';
  txt += `     input: ${result.input}`;
  txt += '\n';
  txt += `     index: ${result.index}`;
  txt += '\n';
  txt += `    length: ${result.length}`;
  txt += '\n';
  txt += `tree depth: ${result.treeDepth}`;
  txt += '\n';
  txt += ` node hits: ${result.nodeHits}`;
  txt += '\n';
  txt += '     rules: ';
  let prefix = '';
  const indent = '          : ';
  const { rules } = result;
  // eslint-disable-next-line no-restricted-syntax
  // eslint-disable-next-line guard-for-in
  for (const name in rules) {
    const rule = rules[name];
    if (rule) {
      for (let i = 0; i < rule.length; i += 1) {
        const ruleobj = rule[i];
        txt += `${prefix + name} : ${ruleobj.index}: `;
        txt += ruleobj.phrase;
        txt += '\n';
        prefix = indent;
      }
    } else {
      txt += `${prefix + name}: `;
      txt += 'undefined';
      txt += '\n';
    }
    prefix = indent;
  }
  return txt;
};
/* result object - string to HTML text */
const sResultToHtml = function sResultToHtml(result) {
  let html = '';
  const caption = 'result:';
  html += `<table class="${style.CLASS_STATE}">\n`;
  html += `<caption>${caption}</caption>\n`;
  html += '<tr>';
  html += '<th>item</th><th>value</th><th>phrase</th>';
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>[0]</td>';
  html += `<td>${result.index}</td>`;
  html += `<td>${phraseStyle(result[0], 'match')}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>input</td>';
  html += '<td>0</td>';
  html += `<td>${phraseStyle(result.input)}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += `<td>index</td><td>${result.index}</td>`;
  html += '<td></td>';
  html += '</tr>\n';

  html += '<tr>';
  html += `<td>length</td><td>${result.length}</td>`;
  html += '<td></td>';
  html += '</tr>\n';

  html += '<tr>';
  html += `<td>tree depth</td><td>${result.treeDepth}</td>`;
  html += '<td></td>';
  html += '</tr>\n';

  html += '<tr>';
  html += `<td>node hits</td><td>${result.nodeHits}</td>`;
  html += '<td></td>';
  html += '</tr>\n';

  html += '<tr>';
  html += '<th>rules</th><th>index</th><th>phrase</th>';
  html += '</tr>\n';

  const { rules } = result;
  for (const name in rules) {
    const rule = rules[name];
    if (rule) {
      for (let i = 0; i < rule.length; i += 1) {
        const ruleobj = rule[i];
        html += '<tr>';
        html += `<td>${name}</td>`;
        html += `<td>${ruleobj.index}</td>`;
        html += `<td>${phraseStyle(ruleobj.phrase, 'match')}</td>`;
        html += '\n';
      }
    } else {
      html += '<tr>';
      html += `<td>${name}</td>`;
      html += '<td></td>';
      html += `<td>${phraseStyle(undefined)}</td>`;
      html += '\n';
    }
  }
  html += '</table>\n';
  return html;
};
/* result object - string to HTML page */
const sResultToHtmlPage = function sResultToHtmlPage(result) {
  return utils.htmlToPage(sResultToHtml(result), 'apg-exp result');
};
/* apg-exp object - string to ASCII text */
const sLastMatchToText = function sLastMatchToText(exp) {
  let txt = '';
  txt += '  last match:\n';
  txt += '   lastIndex: ';
  txt += exp.lastIndex;
  txt += '\n';
  txt += '       flags: "';
  txt += `${exp.flags}"`;
  txt += '\n';
  txt += '      global: ';
  txt += exp.global;
  txt += '\n';
  txt += '      sticky: ';
  txt += exp.sticky;
  txt += '\n';
  txt += '     unicode: ';
  txt += exp.unicode;
  txt += '\n';
  txt += '       debug: ';
  txt += exp.debug;
  txt += '\n';
  if (exp['$&'] === undefined) {
    txt += '   last match: undefined';
    txt += '\n';
    return txt;
  }
  txt += '       input: ';
  txt += exp.input;
  txt += '\n';
  txt += ' leftContext: ';
  txt += exp.leftContext;
  txt += '\n';
  txt += '   lastMatch: ';
  txt += exp.lastMatch;
  txt += '\n';
  txt += 'rightContext: ';
  txt += exp.rightContext;
  txt += '\n';
  txt += '       rules: ';
  let prefix = '';
  const indent = '            : ';
  for (const name in exp.rules) {
    txt += `${prefix + name} : `;
    txt += exp.rules[name];
    txt += '\n';
    prefix = indent;
  }
  txt += '\n';
  txt += 'alias:\n';
  txt += ' ["$_"]: ';
  // eslint-disable-next-line no-underscore-dangle
  txt += exp.$_;
  txt += '\n';
  txt += ' ["$`"]: ';
  txt += exp['$`'];
  txt += '\n';
  txt += ' ["$&"]: ';
  txt += exp['$&'];
  txt += '\n';
  txt += ' ["$\'"]: ';
  txt += exp["$'"];
  txt += '\n';
  for (const name in exp.rules) {
    txt += ` ["\${${name}}"]: `;
    txt += exp[`\${${name}}`];
    txt += '\n';
  }
  return txt;
};
/* apg-exp object - string to HTML text */
const sLastMatchToHtml = function sLastMatchToHtml(exp) {
  let html = '';
  const caption = 'last match:';
  html += `<table class="${style.CLASS_STATE}">\n`;
  html += `<caption>${caption}</caption>\n`;
  html += '<tr>';
  html += '<th>item</th><th>value</th>';
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>lastIndex</td>';
  html += `<td>${exp.lastIndex}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>flags</td>';
  html += `<td>&#34;${exp.flags}&#34;</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>global</td>';
  html += `<td>${exp.global}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>sticky</td>';
  html += `<td>${exp.sticky}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>unicode</td>';
  html += `<td>${exp.unicode}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>debug</td>';
  html += `<td>${exp.debug}</td>`;
  html += '</tr>\n';

  if (exp['$&'] === undefined) {
    html += '<tr>';
    html += '<td>lastMatch</td>';
    html += `<td>${phraseStyle(undefined)}</td>`;
    html += '</tr>\n';
    html += '</table>\n';
    return html;
  }
  html += '<th>item</th><th>phrase</th>';
  html += '</tr>\n';
  html += '<tr>';
  html += '<td>input</td>';
  html += `<td>${phraseStyle(exp.input)}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>leftContext</td>';
  html += `<td>${phraseStyle(exp.leftContext)}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>lastMatch</td>';
  html += `<td>${phraseStyle(exp.lastMatch, 'match')}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>rightContext</td>';
  html += `<td>${phraseStyle(exp.rightContext)}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<th>rule</th><th>phrase</th>';
  html += '</tr>\n';

  for (const name in exp.rules) {
    html += '<tr>';
    html += `<td>${name}</td>`;
    html += `<td>${phraseStyle(exp.rules[name])}</td>`;
    html += '</tr>\n';
  }

  html += '<tr>';
  html += '<th>alias</th><th>phrase</th>';
  html += '</tr>\n';
  html += '<tr>';
  html += '<td>["$_"]</td>';
  // eslint-disable-next-line no-underscore-dangle
  html += `<td>${phraseStyle(exp.$_)}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>["$`"]</td>';
  html += `<td>${phraseStyle(exp['$`'])}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>["$&"]</td>';
  html += `<td>${phraseStyle(exp['$&'], 'match')}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>["$\'"]</td>';
  html += `<td>${phraseStyle(exp["$'"])}</td>`;
  html += '</tr>\n';

  for (const name in exp.rules) {
    html += '<tr>';
    html += `<td>["\${${name}}"]</td>`;
    html += `<td>${phraseStyle(exp[`\${${name}}`])}</td>`;
    html += '</tr>\n';
  }
  html += '</table>\n';
  return html;
};
/* apg-exp object - string to HTML page */
const sLastMatchToHtmlPage = function sLastMatchToHtmlPage(exp) {
  return utils.htmlToPage(sLastMatchToHtml(exp), 'apg-exp last result');
};
/* translates ASCII string to integer mode identifier - defaults to ASCII */
const getMode = function getMode(modearg) {
  let mode = MODE_ASCII;
  if (typeof modearg === 'string' && modearg.length >= 3) {
    const modein = modearg.toLowerCase().slice(0, 3);
    if (modein === 'hex') {
      mode = MODE_HEX;
    } else if (modein === 'dec') {
      mode = MODE_DEC;
    } else if (modein === 'uni') {
      mode = MODE_UNICODE;
    }
  }
  return mode;
};
/* translate integer mode identifier to standard text string */
const modeToText = function modeToText(mode) {
  let txt;
  switch (mode) {
    case MODE_ASCII:
      txt = 'ascii';
      break;
    case MODE_HEX:
      txt = 'hexadecimal';
      break;
    case MODE_DEC:
      txt = 'decimal';
      break;
    case MODE_UNICODE:
      txt = 'Unicode';
      break;
    default:
      throw new Error('recognized mode');
  }
  return txt;
};
/* convert integer to hex with leading 0 if necessary */
const charToHex = function charToHex(char) {
  let ch = char.toString(16);
  if (ch.length % 2 !== 0) {
    ch = `0${ch}`;
  }
  return ch;
};
/* convert integer character code array to formatted text string */
const charsToMode = function charsToMode(chars, mode) {
  let txt = '';
  if (mode === MODE_ASCII) {
    txt += apglib.utils.charsToString(chars);
  } else if (mode === MODE_DEC) {
    txt += '[';
    if (chars.length > 0) {
      txt += chars[0];
      for (let i = 1; i < chars.length; i += 1) {
        txt += `,${chars[i]}`;
      }
    }
    txt += ']';
  } else if (mode === MODE_HEX) {
    txt += '[';
    if (chars.length > 0) {
      txt += `\\x${charToHex(chars[0])}`;
      for (let i = 1; i < chars.length; i += 1) {
        txt += `,\\x${charToHex(chars[i])}`;
      }
    }
    txt += ']';
  } else if (mode === MODE_UNICODE) {
    txt += '[';
    if (chars.length > 0) {
      txt += `\\u${charToHex(chars[0])}`;
      for (let i = 1; i < chars.length; i += 1) {
        txt += `,\\u${charToHex(chars[i])}`;
      }
    }
    txt += ']';
  }
  return txt;
};
/* result object - Unicode mode to ASCII text */
const uResultToText = function uResultToText(result, modeArg) {
  const mode = getMode(modeArg);
  let txt = '';
  txt += `    result(${modeToText(mode)})\n`;
  txt += '       [0]: ';
  txt += charsToMode(result[0], mode);
  txt += '\n';
  txt += `     input: ${charsToMode(result.input, mode)}`;
  txt += '\n';
  txt += `     index: ${result.index}`;
  txt += '\n';
  txt += `    length: ${result.length}`;
  txt += '\n';
  txt += `tree depth: ${result.treeDepth}`;
  txt += '\n';
  txt += ` node hits: ${result.nodeHits}`;
  txt += '\n';
  txt += '     rules: ';
  txt += '\n';
  const { rules } = result;
  for (const name in rules) {
    const rule = rules[name];
    if (rule) {
      for (let i = 0; i < rule.length; i += 1) {
        const ruleobj = rule[i];
        txt += `          :${name} : ${ruleobj.index}: `;
        txt += charsToMode(ruleobj.phrase, mode);
        txt += '\n';
      }
    } else {
      txt += `          :${name}: `;
      txt += 'undefined';
      txt += '\n';
    }
  }
  return txt;
};
/* result object - Unicode mode to HTML text */
const uResultToHtml = function uResultToHtml(result, modeArg) {
  const mode = getMode(modeArg);
  let html = '';
  let caption = 'result:';
  caption += `(${modeToText(mode)})`;
  html += `<table class="${style.CLASS_STATE}">\n`;
  html += `<caption>${caption}</caption>\n`;
  html += '<tr>';
  html += '<th>item</th><th>value</th><th>phrase</th>';
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>[0]</td>';
  html += `<td>${result.index}</td>`;
  html += `<td>${phraseStyle(charsToMode(result[0], mode), 'match')}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>input</td>';
  html += '<td>0</td>';
  html += `<td>${phraseStyle(charsToMode(result.input, mode))}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += `<td>index</td><td>${result.index}</td>`;
  html += '<td></td>';
  html += '</tr>\n';

  html += '<tr>';
  html += `<td>length</td><td>${result.length}</td>`;
  html += '<td></td>';
  html += '</tr>\n';

  html += '<tr>';
  html += `<td>tree depth</td><td>${result.treeDepth}</td>`;
  html += '<td></td>';
  html += '</tr>\n';

  html += '<tr>';
  html += `<td>node hits</td><td>${result.nodeHits}</td>`;
  html += '<td></td>';
  html += '</tr>\n';

  html += '<tr>';
  html += '<th>rules</th><th>index</th><th>phrase</th>';
  html += '</tr>\n';

  const { rules } = result;
  for (const name in rules) {
    const rule = rules[name];
    if (rule) {
      for (let i = 0; i < rule.length; i += 1) {
        const ruleobj = rule[i];
        html += '<tr>';
        html += `<td>${name}</td>`;
        html += `<td>${ruleobj.index}</td>`;
        html += `<td>${phraseStyle(charsToMode(ruleobj.phrase, mode), 'match')}</td>`;
        html += '\n';
      }
    } else {
      html += '<tr>';
      html += `<td>${name}</td>`;
      html += '<td></td>';
      html += `<td>${phraseStyle(undefined)}</td>`;
      html += '\n';
    }
  }
  html += '</table>\n';
  return html;
};
/* result object - Unicode mode to HTML page */
const uResultToHtmlPage = function uResultToHtmlPage(result, mode) {
  return utils.htmlToPage(uResultToHtml(result, mode));
};
/* apg-exp object - Unicode mode to ASCII text */
const uLastMatchToText = function uLastMatchToText(exp, modeArg) {
  const mode = getMode(modeArg);
  let txt = '';
  txt += `  last match(${modeToText(mode)})\n`;
  txt += `   lastIndex: ${exp.lastIndex}`;
  txt += '\n';
  txt += `       flags: "${exp.flags}"`;
  txt += '\n';
  txt += `      global: ${exp.global}`;
  txt += '\n';
  txt += `      sticky: ${exp.sticky}`;
  txt += '\n';
  txt += `     unicode: ${exp.unicode}`;
  txt += '\n';
  txt += `       debug: ${exp.debug}`;
  txt += '\n';
  if (exp['$&'] === undefined) {
    txt += '   lastMatch: undefined';
    txt += '\n';
    return txt;
  }
  txt += '       input: ';
  txt += charsToMode(exp.input, mode);
  txt += '\n';
  txt += ' leftContext: ';
  txt += charsToMode(exp.leftContext, mode);
  txt += '\n';
  txt += '   lastMatch: ';
  txt += charsToMode(exp.lastMatch, mode);
  txt += '\n';
  txt += 'rightContext: ';
  txt += charsToMode(exp.rightContext, mode);
  txt += '\n';

  txt += '       rules:';
  let prefix = '';
  const indent = '            :';
  for (const name in exp.rules) {
    txt += `${prefix + name} : `;
    txt += exp.rules[name] ? charsToMode(exp.rules[name], mode) : 'undefined';
    txt += '\n';
    prefix = indent;
  }
  txt += '\n';
  txt += '  alias:\n';
  txt += '   ["$_"]: ';
  txt += charsToMode(exp.$_, mode);
  txt += '\n';
  txt += '   ["$`"]: ';
  txt += charsToMode(exp['$`'], mode);
  txt += '\n';
  txt += '   ["$&"]: ';
  txt += charsToMode(exp['$&'], mode);
  txt += '\n';
  txt += '   ["$\'"]: ';
  txt += charsToMode(exp["$'"], mode);
  txt += '\n';
  for (const name in exp.rules) {
    txt += `   ["\${${name}}"]: `;
    txt += exp[`\${${name}}`] ? charsToMode(exp[`\${${name}}`], mode) : 'undefined';
    txt += '\n';
  }
  return txt;
};
/* apg-exp object - Unicode mode to HTML text */
const uLastMatchToHtml = function uLastMatchToHtml(exp, modeArg) {
  const mode = getMode(modeArg);
  let html = '';
  let caption = 'last match:';
  caption += `(${modeToText(mode)})`;
  html += `<table class="${style.CLASS_STATE}">\n`;
  html += `<caption>${caption}</caption>\n`;
  html += '<tr>';
  html += '<th>item</th><th>value</th>';
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>lastIndex</td>';
  html += `<td>${exp.lastIndex}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>flags</td>';
  html += `<td>&#34;${exp.flags}&#34;</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>global</td>';
  html += `<td>${exp.global}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>sticky</td>';
  html += `<td>${exp.sticky}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>unicode</td>';
  html += `<td>${exp.unicode}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>debug</td>';
  html += `<td>${exp.debug}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<th>item</th><th>phrase</th>';
  html += '</tr>\n';
  if (exp['$&'] === undefined) {
    html += '<tr>';
    html += '<td>lastMatch</td>';
    html += `<td>${phraseStyle(undefined)}</td>`;
    html += '</tr>\n';
    html += '</table>\n';
    return html;
  }
  html += '<tr>';
  html += '<td>input</td>';
  html += `<td>${phraseStyle(charsToMode(exp.input, mode))}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>leftContext</td>';
  html += `<td>${phraseStyle(charsToMode(exp.leftContext, mode))}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>lastMatch</td>';
  html += `<td>${phraseStyle(charsToMode(exp.lastMatch, mode), 'match')}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>rightContext</td>';
  html += `<td>${phraseStyle(charsToMode(exp.rightContext, mode))}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<th>rules</th><th>phrase</th>';
  html += '</tr>\n';

  for (const name in exp.rules) {
    html += '<tr>';
    html += `<td>${name}</td>`;
    if (exp.rules[name]) {
      html += `<td>${phraseStyle(charsToMode(exp.rules[name], mode))}</td>`;
    } else {
      html += `<td>${phraseStyle(undefined)}</td>`;
    }
    html += '</tr>\n';
  }

  html += '<tr>';
  html += '<th>alias</th><th>phrase</th>';
  html += '</tr>\n';
  html += '<tr>';
  html += '<td>["$_"]</td>';
  html += `<td>${phraseStyle(charsToMode(exp.$_, mode))}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>["$`"]</td>';
  html += `<td>${phraseStyle(charsToMode(exp['$`'], mode))}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>["$&"]</td>';
  html += `<td>${phraseStyle(charsToMode(exp['$&'], mode), 'match')}</td>`;
  html += '</tr>\n';

  html += '<tr>';
  html += '<td>["$\'"]</td>';
  html += `<td>${phraseStyle(charsToMode(exp["$'"], mode))}</td>`;
  html += '</tr>\n';

  for (const name in exp.rules) {
    html += '<tr>';
    html += `<td>["\${${name}}"]</td>`;
    if (exp[`\${${name}}`]) {
      html += `<td>${phraseStyle(charsToMode(exp[`\${${name}}`], mode))}</td>`;
    } else {
      html += `<td>${phraseStyle(undefined)}</td>`;
    }
    html += '</tr>\n';
  }
  html += '</table>\n';
  return html;
};
/* apg-exp object - Unicode mode to HTML page */
const uLastMatchToHtmlPage = function uLastMatchToHtmlPage(exp, mode) {
  return utils.htmlToPage(uLastMatchToHtml(exp, mode));
};
/* SABNF grammar souce to ASCII text */
const sourceToText = function sourceToText(exp) {
  return exp.source;
};
/* SABNF grammar souce to HTML */
const sourceToHtml = function sourceToHtml(exp) {
  const rx = /.*(\r\n|\n|\r)/g;
  let result;
  let chars;
  let html;
  html = '<pre>\n';
  const TRUE = true;
  while (TRUE) {
    result = rx.exec(exp.source);
    if (result === null || result[0] === '') {
      break;
    }
    chars = apglib.utils.stringToChars(result[0]);
    html += apglib.utils.charsToAsciiHtml(chars);
    html += '\n';
  }
  html += '</pre>\n';
  return html;
};
/* SABNF grammar souce to HTML page */
const sourceToHtmlPage = function sourceToHtmlPage(exp) {
  return apglib.utils.htmlToPage(sourceToHtml(exp), 'apg-exp source');
};
/* export modules needed by the apg-exp and result objects to display their values */
module.exports = {
  s: {
    resultToText: sResultToText,
    resultToHtml: sResultToHtml,
    resultToHtmlPage: sResultToHtmlPage,
    expToText: sLastMatchToText,
    expToHtml: sLastMatchToHtml,
    expToHtmlPage: sLastMatchToHtmlPage,
    sourceToText,
    sourceToHtml,
    sourceToHtmlPage,
  },
  u: {
    resultToText: uResultToText,
    resultToHtml: uResultToHtml,
    resultToHtmlPage: uResultToHtmlPage,
    expToText: uLastMatchToText,
    expToHtml: uLastMatchToHtml,
    expToHtmlPage: uLastMatchToHtmlPage,
  },
};
