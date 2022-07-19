/* eslint-disable func-names */
/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This module has all of the callback functions for the syntax phase of the generation.
// See:<br>
// `./dist/abnf-for-sabnf-grammar.bnf`<br>
// for the grammar file these callback functions are based on.
module.exports = function exfn() {
  const thisFileName = 'syntax-callbacks.js: ';
  const apglib = require('../apg-lib/node-exports');
  const id = apglib.ids;
  let topAlt;
  /* syntax, RNM, callback functions */
  const synFile = function synFile(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        data.altStack = [];
        data.repCount = 0;
        break;
      case id.EMPTY:
        data.errors.push({
          line: 0,
          char: 0,
          msg: 'grammar file is empty',
        });
        break;
      case id.MATCH:
        if (data.ruleCount === 0) {
          data.errors.push({
            line: 0,
            char: 0,
            msg: 'no rules defined',
          });
        }
        break;
      case id.NOMATCH:
        throw new Error(`${thisFileName}synFile: grammar file NOMATCH: design error: should never happen.`);
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  // eslint-disable-next-line func-names
  const synRule = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        data.altStack.length = 0;
        topAlt = {
          groupOpen: null,
          groupError: false,
          optionOpen: null,
          optionError: false,
          tlsOpen: null,
          clsOpen: null,
          prosValOpen: null,
          basicError: false,
        };
        data.altStack.push(topAlt);
        break;
      case id.EMPTY:
        throw new Error(`${thisFileName}synRule: EMPTY: rule cannot be empty`);
      case id.NOMATCH:
        break;
      case id.MATCH:
        data.ruleCount += 1;
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synRuleError = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        data.errors.push({
          line: data.findLine(data.lines, phraseIndex, data.charsLength),
          char: phraseIndex,
          msg: 'Unrecognized SABNF line. Invalid rule, comment or blank line.',
        });
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synRuleNameError = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        data.errors.push({
          line: data.findLine(data.lines, phraseIndex, data.charsLength),
          char: phraseIndex,
          msg: 'Rule names must be alphanum and begin with alphabetic character.',
        });
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synDefinedAsError = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        data.errors.push({
          line: data.findLine(data.lines, phraseIndex, data.charsLength),
          char: phraseIndex,
          msg: "Expected '=' or '=/'. Not found.",
        });
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synAndOp = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        if (data.strict) {
          data.errors.push({
            line: data.findLine(data.lines, phraseIndex, data.charsLength),
            char: phraseIndex,
            msg: 'AND operator(&) found - strict ABNF specified.',
          });
        }
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synNotOp = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        if (data.strict) {
          data.errors.push({
            line: data.findLine(data.lines, phraseIndex, data.charsLength),
            char: phraseIndex,
            msg: 'NOT operator(!) found - strict ABNF specified.',
          });
        }
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synBkaOp = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        if (data.strict) {
          data.errors.push({
            line: data.findLine(data.lines, phraseIndex, data.charsLength),
            char: phraseIndex,
            msg: 'Positive look-behind operator(&&) found - strict ABNF specified.',
          });
        }
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synBknOp = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        if (data.strict) {
          data.errors.push({
            line: data.findLine(data.lines, phraseIndex, data.charsLength),
            char: phraseIndex,
            msg: 'Negative look-behind operator(!!) found - strict ABNF specified.',
          });
        }
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synAbgOp = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        if (data.strict) {
          data.errors.push({
            line: data.findLine(data.lines, phraseIndex, data.charsLength),
            char: phraseIndex,
            msg: 'Beginning of string anchor(%^) found - strict ABNF specified.',
          });
        }
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synAenOp = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        if (data.strict) {
          data.errors.push({
            line: data.findLine(data.lines, phraseIndex, data.charsLength),
            char: phraseIndex,
            msg: 'End of string anchor(%$) found - strict ABNF specified.',
          });
        }
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synBkrOp = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        if (data.strict) {
          const name = apglib.utils.charsToString(chars, phraseIndex, result.phraseLength);
          data.errors.push({
            line: data.findLine(data.lines, phraseIndex, data.charsLength),
            char: phraseIndex,
            msg: `Back reference operator(${name}) found - strict ABNF specified.`,
          });
        }
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synUdtOp = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        if (data.strict) {
          const name = apglib.utils.charsToString(chars, phraseIndex, result.phraseLength);
          data.errors.push({
            line: data.findLine(data.lines, phraseIndex, data.charsLength),
            char: phraseIndex,
            msg: `UDT operator found(${name}) - strict ABNF specified.`,
          });
        }
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synTlsOpen = function (result, chars, phraseIndex) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        topAlt.tlsOpen = phraseIndex;
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synTlsString = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        data.stringTabChar = false;
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        if (data.stringTabChar !== false) {
          data.errors.push({
            line: data.findLine(data.lines, data.stringTabChar),
            char: data.stringTabChar,
            msg: "Tab character (\\t, x09) not allowed in literal string (see 'quoted-string' definition, RFC 7405.)",
          });
        }
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synStringTab = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        data.stringTabChar = phraseIndex;
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synTlsClose = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        data.errors.push({
          line: data.findLine(data.lines, topAlt.tlsOpen),
          char: topAlt.tlsOpen,
          msg: 'Case-insensitive literal string("...") opened but not closed.',
        });
        topAlt.basicError = true;
        topAlt.tlsOpen = null;
        break;
      case id.MATCH:
        topAlt.tlsOpen = null;
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synClsOpen = function (result, chars, phraseIndex) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        topAlt.clsOpen = phraseIndex;
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synClsString = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        data.stringTabChar = false;
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        if (data.stringTabChar !== false) {
          data.errors.push({
            line: data.findLine(data.lines, data.stringTabChar),
            char: data.stringTabChar,
            msg: 'Tab character (\\t, x09) not allowed in literal string.',
          });
        }
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synClsClose = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        data.errors.push({
          line: data.findLine(data.lines, topAlt.clsOpen),
          char: topAlt.clsOpen,
          msg: "Case-sensitive literal string('...') opened but not closed.",
        });
        topAlt.clsOpen = null;
        topAlt.basicError = true;
        break;
      case id.MATCH:
        if (data.strict) {
          data.errors.push({
            line: data.findLine(data.lines, topAlt.clsOpen),
            char: topAlt.clsOpen,
            msg: "Case-sensitive string operator('...') found - strict ABNF specified.",
          });
        }
        topAlt.clsOpen = null;
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synProsValOpen = function (result, chars, phraseIndex) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        topAlt.prosValOpen = phraseIndex;
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synProsValString = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        data.stringTabChar = false;
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        if (data.stringTabChar !== false) {
          data.errors.push({
            line: data.findLine(data.lines, data.stringTabChar),
            char: data.stringTabChar,
            msg: 'Tab character (\\t, x09) not allowed in prose value string.',
          });
        }
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synProsValClose = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        data.errors.push({
          line: data.findLine(data.lines, topAlt.prosValOpen),
          char: topAlt.prosValOpen,
          msg: 'Prose value operator(<...>) opened but not closed.',
        });
        topAlt.basicError = true;
        topAlt.prosValOpen = null;
        break;
      case id.MATCH:
        data.errors.push({
          line: data.findLine(data.lines, topAlt.prosValOpen),
          char: topAlt.prosValOpen,
          msg: 'Prose value operator(<...>) found. The ABNF syntax is valid, but a parser cannot be generated from this grammar.',
        });
        topAlt.prosValOpen = null;
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synGroupOpen = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        topAlt = {
          groupOpen: phraseIndex,
          groupError: false,
          optionOpen: null,
          optionError: false,
          tlsOpen: null,
          clsOpen: null,
          prosValOpen: null,
          basicError: false,
        };
        data.altStack.push(topAlt);
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synGroupClose = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        data.errors.push({
          line: data.findLine(data.lines, topAlt.groupOpen),
          char: topAlt.groupOpen,
          msg: 'Group "(...)" opened but not closed.',
        });
        topAlt = data.altStack.pop();
        topAlt.groupError = true;
        break;
      case id.MATCH:
        topAlt = data.altStack.pop();
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synOptionOpen = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        topAlt = {
          groupOpen: null,
          groupError: false,
          optionOpen: phraseIndex,
          optionError: false,
          tlsOpen: null,
          clsOpen: null,
          prosValOpen: null,
          basicError: false,
        };
        data.altStack.push(topAlt);
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synOptionClose = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        data.errors.push({
          line: data.findLine(data.lines, topAlt.optionOpen),
          char: topAlt.optionOpen,
          msg: 'Option "[...]" opened but not closed.',
        });
        topAlt = data.altStack.pop();
        topAlt.optionError = true;
        break;
      case id.MATCH:
        topAlt = data.altStack.pop();
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synBasicElementError = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        if (topAlt.basicError === false) {
          data.errors.push({
            line: data.findLine(data.lines, phraseIndex, data.charsLength),
            char: phraseIndex,
            msg: 'Unrecognized SABNF element.',
          });
        }
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synLineEnd = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        if (result.phraseLength === 1 && data.strict) {
          const end = chars[phraseIndex] === 13 ? 'CR' : 'LF';
          data.errors.push({
            line: data.findLine(data.lines, phraseIndex, data.charsLength),
            char: phraseIndex,
            msg: `Line end '${end}' found - strict ABNF specified, only CRLF allowed.`,
          });
        }
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synLineEndError = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        break;
      case id.MATCH:
        data.errors.push({
          line: data.findLine(data.lines, phraseIndex, data.charsLength),
          char: phraseIndex,
          msg: 'Unrecognized grammar element or characters.',
        });
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  const synRepetition = function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        break;
      case id.EMPTY:
        break;
      case id.NOMATCH:
        data.repCount += 1;
        break;
      case id.MATCH:
        data.repCount += 1;
        break;
      default:
        throw new Error(`${thisFileName}synFile: unrecognized case.`);
    }
  };
  // Define the list of callback functions.
  this.callbacks = [];
  this.callbacks.andop = synAndOp;
  this.callbacks.basicelementerr = synBasicElementError;
  this.callbacks.clsclose = synClsClose;
  this.callbacks.clsopen = synClsOpen;
  this.callbacks.clsstring = synClsString;
  this.callbacks.definedaserror = synDefinedAsError;
  this.callbacks.file = synFile;
  this.callbacks.groupclose = synGroupClose;
  this.callbacks.groupopen = synGroupOpen;
  this.callbacks.lineenderror = synLineEndError;
  this.callbacks.lineend = synLineEnd;
  this.callbacks.notop = synNotOp;
  this.callbacks.optionclose = synOptionClose;
  this.callbacks.optionopen = synOptionOpen;
  this.callbacks.prosvalclose = synProsValClose;
  this.callbacks.prosvalopen = synProsValOpen;
  this.callbacks.prosvalstring = synProsValString;
  this.callbacks.repetition = synRepetition;
  this.callbacks.rule = synRule;
  this.callbacks.ruleerror = synRuleError;
  this.callbacks.rulenameerror = synRuleNameError;
  this.callbacks.stringtab = synStringTab;
  this.callbacks.tlsclose = synTlsClose;
  this.callbacks.tlsopen = synTlsOpen;
  this.callbacks.tlsstring = synTlsString;
  this.callbacks.udtop = synUdtOp;
  this.callbacks.bkaop = synBkaOp;
  this.callbacks.bknop = synBknOp;
  this.callbacks.bkrop = synBkrOp;
  this.callbacks.abgop = synAbgOp;
  this.callbacks.aenop = synAenOp;
};
