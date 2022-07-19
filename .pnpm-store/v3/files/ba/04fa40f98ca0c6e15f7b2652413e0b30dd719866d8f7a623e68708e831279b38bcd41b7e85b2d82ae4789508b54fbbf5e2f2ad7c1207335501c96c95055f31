/* eslint-disable func-names */
/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This module exports a variety of utility functions that support
// [`apg`](https://github.com/ldthomas/apg-js2), [`apg-lib`](https://github.com/ldthomas/apg-js2-lib)
// and the generated parser applications.

const style = require('./style');
const converter = require('../apg-conv-api/converter');
const emitCss = require('./emitcss');
const id = require('./identifiers');

const thisFileName = 'utilities.js: ';
const thisThis = this;

/* translate (implied) phrase beginning character and length to actual first and last character indexes */
/* used by multiple phrase handling functions */
const getBounds = function (length, begArg, len) {
  let end;
  let beg = begArg;
  const TRUE = true;
  while (TRUE) {
    if (length <= 0) {
      beg = 0;
      end = 0;
      break;
    }
    if (typeof beg !== 'number') {
      beg = 0;
      end = length;
      break;
    }
    if (beg >= length) {
      beg = length;
      end = length;
      break;
    }
    if (typeof len !== 'number') {
      end = length;
      break;
    }
    end = beg + len;
    if (end > length) {
      end = length;
      break;
    }
    break;
  }
  return {
    beg,
    end,
  };
};
// Generates a complete, minimal HTML5 page, inserting the user's HTML text on the page.
// - *html* - the page text in HTML format
// - *title* - the HTML page `<title>` - defaults to `htmlToPage`.
exports.htmlToPage = function (html, titleArg) {
  let title;
  if (typeof html !== 'string') {
    throw new Error(`${thisFileName}htmlToPage: input HTML is not a string`);
  }
  if (typeof titleArg !== 'string') {
    title = 'htmlToPage';
  } else {
    title = titleArg;
  }
  let page = '';
  page += '<!DOCTYPE html>\n';
  page += '<html lang="en">\n';
  page += '<head>\n';
  page += '<meta charset="utf-8">\n';
  page += `<title>${title}</title>\n`;
  page += '<style>\n';
  page += emitCss();
  page += '</style>\n';
  page += '</head>\n<body>\n';
  page += `<p>${new Date()}</p>\n`;
  page += html;
  page += '</body>\n</html>\n';
  return page;
};
// Formats the returned object from `parser.parse()`
// into an HTML table.
// ```
// return {
//   success : sysData.success,
//   state : sysData.state,
//   length : charsLength,
//   matched : sysData.phraseLength,
//   maxMatched : maxMatched,
//   maxTreeDepth : maxTreeDepth,
//   nodeHits : nodeHits,
//   inputLength : chars.length,
//   subBegin : charsBegin,
//   subEnd : charsEnd,
//   subLength : charsLength
// };
// ```
exports.parserResultToHtml = function (result, caption) {
  let cap = null;
  if (typeof caption === 'string' && caption !== '') {
    cap = caption;
  }
  let success;
  let state;
  if (result.success === true) {
    success = `<span class="${style.CLASS_MATCH}">true</span>`;
  } else {
    success = `<span class="${style.CLASS_NOMATCH}">false</span>`;
  }
  if (result.state === id.EMPTY) {
    state = `<span class="${style.CLASS_EMPTY}">EMPTY</span>`;
  } else if (result.state === id.MATCH) {
    state = `<span class="${style.CLASS_MATCH}">MATCH</span>`;
  } else if (result.state === id.NOMATCH) {
    state = `<span class="${style.CLASS_NOMATCH}">NOMATCH</span>`;
  } else {
    state = `<span class="${style.CLASS_NOMATCH}">unrecognized</span>`;
  }
  let html = '';
  html += `<table class="${style.CLASS_STATE}">\n`;
  if (cap) {
    html += `<caption>${cap}</caption>\n`;
  }
  html += '<tr><th>state item</th><th>value</th><th>description</th></tr>\n';
  html += `<tr><td>parser success</td><td>${success}</td>\n`;
  html += `<td><span class="${style.CLASS_MATCH}">true</span> if the parse succeeded,\n`;
  html += ` <span class="${style.CLASS_NOMATCH}">false</span> otherwise`;
  html += '<br><i>NOTE: for success, entire string must be matched</i></td></tr>\n';
  html += `<tr><td>parser state</td><td>${state}</td>\n`;
  html += `<td><span class="${style.CLASS_EMPTY}">EMPTY</span>, `;
  html += `<span class="${style.CLASS_MATCH}">MATCH</span> or \n`;
  html += `<span class="${style.CLASS_NOMATCH}">NOMATCH</span></td></tr>\n`;
  html += `<tr><td>string length</td><td>${result.length}</td><td>length of the input (sub)string</td></tr>\n`;
  html += `<tr><td>matched length</td><td>${result.matched}</td><td>number of input string characters matched</td></tr>\n`;
  html += `<tr><td>max matched</td><td>${result.maxMatched}</td><td>maximum number of input string characters matched</td></tr>\n`;
  html += `<tr><td>max tree depth</td><td>${result.maxTreeDepth}</td><td>maximum depth of the parse tree reached</td></tr>\n`;
  html += `<tr><td>node hits</td><td>${result.nodeHits}</td><td>number of parse tree node hits (opcode function calls)</td></tr>\n`;
  html += `<tr><td>input length</td><td>${result.inputLength}</td><td>length of full input string</td></tr>\n`;
  html += `<tr><td>sub-string begin</td><td>${result.subBegin}</td><td>sub-string first character index</td></tr>\n`;
  html += `<tr><td>sub-string end</td><td>${result.subEnd}</td><td>sub-string end-of-string index</td></tr>\n`;
  html += `<tr><td>sub-string length</td><td>${result.subLength}</td><td>sub-string length</td></tr>\n`;
  html += '</table>\n';
  return html;
};
// Translates a sub-array of integer character codes into a string.
// Very useful in callback functions to translate the matched phrases into strings.
exports.charsToString = function (chars, phraseIndex, phraseLength) {
  let beg;
  let end;
  if (typeof phraseIndex === 'number') {
    if (phraseIndex >= chars.length) {
      return '';
    }
    beg = phraseIndex < 0 ? 0 : phraseIndex;
  } else {
    beg = 0;
  }
  if (typeof phraseLength === 'number') {
    if (phraseLength <= 0) {
      return '';
    }
    end = phraseLength > chars.length - beg ? chars.length : beg + phraseLength;
  } else {
    end = chars.length;
  }
  if (beg < end) {
    return converter.encode('UTF16LE', chars.slice(beg, end)).toString('utf16le');
  }
  return '';
};
// Translates a string into an array of integer character codes.
exports.stringToChars = function (string) {
  return converter.decode('STRING', string);
};
// Translates an opcode identifier into a human-readable string.
exports.opcodeToString = function (type) {
  let ret = 'unknown';
  switch (type) {
    case id.ALT:
      ret = 'ALT';
      break;
    case id.CAT:
      ret = 'CAT';
      break;
    case id.RNM:
      ret = 'RNM';
      break;
    case id.UDT:
      ret = 'UDT';
      break;
    case id.AND:
      ret = 'AND';
      break;
    case id.NOT:
      ret = 'NOT';
      break;
    case id.REP:
      ret = 'REP';
      break;
    case id.TRG:
      ret = 'TRG';
      break;
    case id.TBS:
      ret = 'TBS';
      break;
    case id.TLS:
      ret = 'TLS';
      break;
    case id.BKR:
      ret = 'BKR';
      break;
    case id.BKA:
      ret = 'BKA';
      break;
    case id.BKN:
      ret = 'BKN';
      break;
    case id.ABG:
      ret = 'ABG';
      break;
    case id.AEN:
      ret = 'AEN';
      break;
    default:
      throw new Error('unrecognized opcode');
  }
  return ret;
};
// Translates an state identifier into a human-readable string.
exports.stateToString = function (state) {
  let ret = 'unknown';
  switch (state) {
    case id.ACTIVE:
      ret = 'ACTIVE';
      break;
    case id.MATCH:
      ret = 'MATCH';
      break;
    case id.EMPTY:
      ret = 'EMPTY';
      break;
    case id.NOMATCH:
      ret = 'NOMATCH';
      break;
    default:
      throw new Error('unrecognized state');
  }
  return ret;
};
// Array which translates all 128, 7-bit ASCII character codes to their respective HTML format.
exports.asciiChars = [
  'NUL',
  'SOH',
  'STX',
  'ETX',
  'EOT',
  'ENQ',
  'ACK',
  'BEL',
  'BS',
  'TAB',
  'LF',
  'VT',
  'FF',
  'CR',
  'SO',
  'SI',
  'DLE',
  'DC1',
  'DC2',
  'DC3',
  'DC4',
  'NAK',
  'SYN',
  'ETB',
  'CAN',
  'EM',
  'SUB',
  'ESC',
  'FS',
  'GS',
  'RS',
  'US',
  '&nbsp;',
  '!',
  '&#34;',
  '#',
  '$',
  '%',
  '&#38;',
  '&#39;',
  '(',
  ')',
  '*',
  '+',
  ',',
  '-',
  '.',
  '/',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  ':',
  ';',
  '&#60;',
  '=',
  '&#62;',
  '?',
  '@',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  '[',
  '&#92;',
  ']',
  '^',
  '_',
  '`',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  '{',
  '|',
  '}',
  '~',
  'DEL',
];
// Translates a single character to hexadecimal with leading zeros for 2, 4, or 8 digit display.
exports.charToHex = function (char) {
  let ch = char.toString(16).toUpperCase();
  switch (ch.length) {
    case 1:
    case 3:
    case 7:
      ch = `0${ch}`;
      break;
    case 2:
    case 6:
      ch = `00${ch}`;
      break;
    case 4:
      break;
    case 5:
      ch = `000${ch}`;
      break;
    default:
      throw new Error('unrecognized option');
  }
  return ch;
};
// Translates a sub-array of character codes to decimal display format.
exports.charsToDec = function (chars, beg, len) {
  let ret = '';
  if (!Array.isArray(chars)) {
    throw new Error(`${thisFileName}charsToDec: input must be an array of integers`);
  }
  const bounds = getBounds(chars.length, beg, len);
  if (bounds.end > bounds.beg) {
    ret += chars[bounds.beg];
    for (let i = bounds.beg + 1; i < bounds.end; i += 1) {
      ret += `,${chars[i]}`;
    }
  }
  return ret;
};
// Translates a sub-array of character codes to hexadecimal display format.
exports.charsToHex = function (chars, beg, len) {
  let ret = '';
  if (!Array.isArray(chars)) {
    throw new Error(`${thisFileName}charsToHex: input must be an array of integers`);
  }
  const bounds = getBounds(chars.length, beg, len);
  if (bounds.end > bounds.beg) {
    ret += `\\x${thisThis.charToHex(chars[bounds.beg])}`;
    for (let i = bounds.beg + 1; i < bounds.end; i += 1) {
      ret += `,\\x${thisThis.charToHex(chars[i])}`;
    }
  }
  return ret;
};
exports.charsToHtmlEntities = function (chars, beg, len) {
  let ret = '';
  if (!Array.isArray(chars)) {
    throw new Error(`${thisFileName}charsToHex: input must be an array of integers`);
  }
  const bounds = getBounds(chars.length, beg, len);
  if (bounds.end > bounds.beg) {
    for (let i = bounds.beg; i < bounds.end; i += 1) {
      ret += `&#x${chars[i].toString(16)};`;
    }
  }
  return ret;
};
// Translates a sub-array of character codes to Unicode display format.
function isUnicode(char) {
  if (char >= 0xd800 && char <= 0xdfff) {
    return false;
  }
  if (char > 0x10ffff) {
    return false;
  }
  return true;
}
exports.charsToUnicode = function (chars, beg, len) {
  let ret = '';
  if (!Array.isArray(chars)) {
    throw new Error(`${thisFileName}charsToUnicode: input must be an array of integers`);
  }
  const bounds = getBounds(chars.length, beg, len);
  if (bounds.end > bounds.beg) {
    for (let i = bounds.beg; i < bounds.end; i += 1) {
      if (isUnicode(chars[i])) {
        ret += `&#${chars[i]};`;
      } else {
        ret += ` U+${thisThis.charToHex(chars[i])}`;
      }
    }
  }
  return ret;
};
// Translates a sub-array of character codes to JavaScript Unicode display format (`\uXXXX`).
exports.charsToJsUnicode = function (chars, beg, len) {
  let ret = '';
  if (!Array.isArray(chars)) {
    throw new Error(`${thisFileName}charsToJsUnicode: input must be an array of integers`);
  }
  const bounds = getBounds(chars.length, beg, len);
  if (bounds.end > bounds.beg) {
    ret += `\\u${thisThis.charToHex(chars[bounds.beg])}`;
    for (let i = bounds.beg + 1; i < bounds.end; i += 1) {
      ret += `,\\u${thisThis.charToHex(chars[i])}`;
    }
  }
  return ret;
};
// Translates a sub-array of character codes to printing ASCII character display format.
exports.charsToAscii = function (chars, beg, len) {
  let ret = '';
  if (!Array.isArray(chars)) {
    throw new Error(`${thisFileName}charsToAscii: input must be an array of integers`);
  }
  const bounds = getBounds(chars.length, beg, len);
  for (let i = bounds.beg; i < bounds.end; i += 1) {
    const char = chars[i];
    if (char >= 32 && char <= 126) {
      ret += String.fromCharCode(char);
    } else {
      ret += `\\x${thisThis.charToHex(char)}`;
    }
  }
  return ret;
};
// Translates a sub-array of character codes to HTML display format.
exports.charsToAsciiHtml = function (chars, beg, len) {
  if (!Array.isArray(chars)) {
    throw new Error(`${thisFileName}charsToAsciiHtml: input must be an array of integers`);
  }
  let html = '';
  let char;
  const bounds = getBounds(chars.length, beg, len);
  for (let i = bounds.beg; i < bounds.end; i += 1) {
    char = chars[i];
    if (char < 32 || char === 127) {
      /* control characters */
      html += `<span class="${style.CLASS_CTRLCHAR}">${thisThis.asciiChars[char]}</span>`;
    } else if (char > 127) {
      /* non-ASCII */
      html += `<span class="${style.CLASS_CTRLCHAR}">U+${thisThis.charToHex(char)}</span>`;
    } else {
      /* printing ASCII, 32 <= char <= 126 */
      html += thisThis.asciiChars[char];
    }
  }
  return html;
};
// Translates a JavaScript string to HTML display format.
exports.stringToAsciiHtml = function (str) {
  const chars = converter.decode('STRING', str);
  return this.charsToAsciiHtml(chars);
};
