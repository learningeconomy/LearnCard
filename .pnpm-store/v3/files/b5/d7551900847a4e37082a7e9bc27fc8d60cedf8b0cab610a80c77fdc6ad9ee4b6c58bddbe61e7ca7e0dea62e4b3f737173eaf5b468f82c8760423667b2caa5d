/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This module has all of the AST translation callback functions for the semantic analysis
// phase of the generator.
// See:<br>
// `./dist/abnf-for-sabnf-grammar.bnf`<br>
// for the grammar file these callback functions are based on.
module.exports = function exfn() {
  const apglib = require('../apg-lib/node-exports');
  const id = apglib.ids;

  /* Some helper functions. */
  const NameList = function NameList() {
    this.names = [];
    /* Adds a new rule name object to the list. Returns -1 if the name already exists. */
    /* Returns the added name object if the name does not already exist. */
    this.add = function add(name) {
      let ret = -1;
      const find = this.get(name);
      if (find === -1) {
        ret = {
          name,
          lower: name.toLowerCase(),
          index: this.names.length,
        };
        this.names.push(ret);
      }
      return ret;
    };
    /* Brute-force look up. */
    this.get = function get(name) {
      let ret = -1;
      const lower = name.toLowerCase();
      for (let i = 0; i < this.names.length; i += 1) {
        if (this.names[i].lower === lower) {
          ret = this.names[i];
          break;
        }
      }
      return ret;
    };
  };
  /* converts text decimal numbers from, e.g. %d99, to an integer */
  const decnum = function decnum(chars, beg, len) {
    let num = 0;
    for (let i = beg; i < beg + len; i += 1) {
      num = 10 * num + chars[i] - 48;
    }
    return num;
  };
  /* converts text binary numbers from, e.g. %b10, to an integer */
  const binnum = function binnum(chars, beg, len) {
    let num = 0;
    for (let i = beg; i < beg + len; i += 1) {
      num = 2 * num + chars[i] - 48;
    }
    return num;
  };
  /* converts text hexadecimal numbers from, e.g. %xff, to an integer */
  const hexnum = function hexnum(chars, beg, len) {
    let num = 0;
    for (let i = beg; i < beg + len; i += 1) {
      let digit = chars[i];
      if (digit >= 48 && digit <= 57) {
        digit -= 48;
      } else if (digit >= 65 && digit <= 70) {
        digit -= 55;
      } else if (digit >= 97 && digit <= 102) {
        digit -= 87;
      } else {
        throw new Error('hexnum out of range');
      }
      num = 16 * num + digit;
    }
    return num;
  };

  // This is the prototype for all semantic analysis callback functions.
  // ````
  // state - the translator state
  //   id.SEM_PRE for downward (pre-branch) traversal of the AST
  //   id.SEM_POST for upward (post branch) traversal of the AST
  // chars - the array of character codes for the input string
  // phraseIndex - index into the chars array to the first
  //               character of the phrase
  // phraseCount - the number of characters in the phrase
  // data - user-defined data passed to the translator
  //        for use by the callback functions.
  // @return id.SEM_OK, normal return.
  //         id.SEM_SKIP in state id.SEM_PRE will
  //         skip the branch below.
  //         Any thing else is an error which will
  //         stop the translation.
  // ````
  /*
  function semCallbackPrototype(state, chars, phraseIndex, phraseCount, data) {
    let ret = id.SEM_OK;
    if (state === id.SEM_PRE) {
    } else if (state === id.SEM_POST) {
    }
    return ret;
  }
  */
  // The AST callback functions.
  function semFile(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_PRE) {
      data.ruleNames = new NameList();
      data.udtNames = new NameList();
      data.rules = [];
      data.udts = [];
      data.rulesLineMap = [];
      data.opcodes = [];
      data.altStack = [];
      data.topStack = null;
      data.topRule = null;
    } else if (state === id.SEM_POST) {
      /* validate RNM rule names and set opcode rule index */
      let nameObj;
      data.rules.forEach((rule) => {
        rule.isBkr = false;
        rule.opcodes.forEach((op) => {
          if (op.type === id.RNM) {
            nameObj = data.ruleNames.get(op.index.name);
            if (nameObj === -1) {
              data.errors.push({
                line: data.findLine(data.lines, op.index.phraseIndex, data.charsLength),
                char: op.index.phraseIndex,
                msg: `Rule name '${op.index.name}' used but not defined.`,
              });
              op.index = -1;
            } else {
              op.index = nameObj.index;
            }
          }
        });
      });
      /* validate BKR rule names and set opcode rule index */
      data.udts.forEach((udt) => {
        udt.isBkr = false;
      });
      data.rules.forEach((rule) => {
        rule.opcodes.forEach((op) => {
          if (op.type === id.BKR) {
            rule.hasBkr = true;
            nameObj = data.ruleNames.get(op.index.name);
            if (nameObj !== -1) {
              data.rules[nameObj.index].isBkr = true;
              op.index = nameObj.index;
            } else {
              nameObj = data.udtNames.get(op.index.name);
              if (nameObj !== -1) {
                data.udts[nameObj.index].isBkr = true;
                op.index = data.rules.length + nameObj.index;
              } else {
                data.errors.push({
                  line: data.findLine(data.lines, op.index.phraseIndex, data.charsLength),
                  char: op.index.phraseIndex,
                  msg: `Back reference name '${op.index.name}' refers to undefined rule or unamed UDT.`,
                });
                op.index = -1;
              }
            }
          }
        });
      });
    }
    return ret;
  }
  function semRule(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_PRE) {
      data.altStack.length = 0;
      data.topStack = null;
      data.rulesLineMap.push({
        line: data.findLine(data.lines, phraseIndex, data.charsLength),
        char: phraseIndex,
      });
    }
    return ret;
  }
  function semRuleLookup(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_PRE) {
      data.ruleName = '';
      data.definedas = '';
    } else if (state === id.SEM_POST) {
      let ruleName;
      if (data.definedas === '=') {
        ruleName = data.ruleNames.add(data.ruleName);
        if (ruleName === -1) {
          data.definedas = null;
          data.errors.push({
            line: data.findLine(data.lines, phraseIndex, data.charsLength),
            char: phraseIndex,
            msg: `Rule name '${data.ruleName}' previously defined.`,
          });
        } else {
          /* start a new rule */
          data.topRule = {
            name: ruleName.name,
            lower: ruleName.lower,
            opcodes: [],
            index: ruleName.index,
          };
          data.rules.push(data.topRule);
          data.opcodes = data.topRule.opcodes;
        }
      } else {
        ruleName = data.ruleNames.get(data.ruleName);
        if (ruleName === -1) {
          data.definedas = null;
          data.errors.push({
            line: data.findLine(data.lines, phraseIndex, data.charsLength),
            char: phraseIndex,
            msg: `Rule name '${data.ruleName}' for incremental alternate not previously defined.`,
          });
        } else {
          data.topRule = data.rules[ruleName.index];
          data.opcodes = data.topRule.opcodes;
        }
      }
    }
    return ret;
  }
  function semAlternation(state, chars, phraseIndex, phraseCount, data) {
    let ret = id.SEM_OK;
    if (state === id.SEM_PRE) {
      const TRUE = true;
      while (TRUE) {
        if (data.definedas === null) {
          /* rule error - skip opcode generation */
          ret = id.SEM_SKIP;
          break;
        }
        if (data.topStack === null) {
          /* top-level ALT */
          if (data.definedas === '=') {
            /* "=" new rule */
            data.topStack = {
              alt: {
                type: id.ALT,
                children: [],
              },
              cat: null,
            };
            data.altStack.push(data.topStack);
            data.opcodes.push(data.topStack.alt);
            break;
          }
          /* "=/" incremental alternate */
          data.topStack = {
            alt: data.opcodes[0],
            cat: null,
          };
          data.altStack.push(data.topStack);
          break;
        }
        /* lower-level ALT */
        data.topStack = {
          alt: {
            type: id.ALT,
            children: [],
          },
          cat: null,
        };
        data.altStack.push(data.topStack);
        data.opcodes.push(data.topStack.alt);
        break;
      }
    } else if (state === id.SEM_POST) {
      data.altStack.pop();
      if (data.altStack.length > 0) {
        data.topStack = data.altStack[data.altStack.length - 1];
      } else {
        data.topStack = null;
      }
    }
    return ret;
  }
  function semConcatenation(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_PRE) {
      data.topStack.alt.children.push(data.opcodes.length);
      data.topStack.cat = {
        type: id.CAT,
        children: [],
      };
      data.opcodes.push(data.topStack.cat);
    } else if (state === id.SEM_POST) {
      data.topStack.cat = null;
    }
    return ret;
  }
  function semRepetition(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_PRE) {
      data.topStack.cat.children.push(data.opcodes.length);
    }
    return ret;
  }
  function semOptionOpen(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.opcodes.push({
        type: id.REP,
        min: 0,
        max: 1,
        char: phraseIndex,
      });
    }
    return ret;
  }
  function semRuleName(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_PRE) {
      data.ruleName = apglib.utils.charsToString(chars, phraseIndex, phraseCount);
    }
    return ret;
  }
  function semDefined(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.definedas = '=';
    }
    return ret;
  }
  function semIncAlt(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.definedas = '=/';
    }
    return ret;
  }
  function semRepOp(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_PRE) {
      data.min = 0;
      data.max = Infinity;
      data.topRep = {
        type: id.REP,
        min: 0,
        max: Infinity,
      };
      data.opcodes.push(data.topRep);
    } else if (state === id.SEM_POST) {
      if (data.min > data.max) {
        data.errors.push({
          line: data.findLine(data.lines, phraseIndex, data.charsLength),
          char: phraseIndex,
          msg: `repetition min cannot be greater than max: min: ${data.min}: max: ${data.max}`,
        });
      }
      data.topRep.min = data.min;
      data.topRep.max = data.max;
    }
    return ret;
  }
  function semRepMin(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.min = decnum(chars, phraseIndex, phraseCount);
    }
    return ret;
  }
  function semRepMax(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.max = decnum(chars, phraseIndex, phraseCount);
    }
    return ret;
  }
  function semRepMinMax(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.max = decnum(chars, phraseIndex, phraseCount);
      data.min = data.max;
    }
    return ret;
  }
  function semAndOp(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.opcodes.push({
        type: id.AND,
      });
    }
    return ret;
  }
  function semNotOp(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.opcodes.push({
        type: id.NOT,
      });
    }
    return ret;
  }
  function semRnmOp(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.opcodes.push({
        type: id.RNM,
        /* NOTE: this is temporary info, index will be replaced with integer later. */
        /* Probably not the best coding practice but here you go. */
        index: {
          phraseIndex,
          name: apglib.utils.charsToString(chars, phraseIndex, phraseCount),
        },
      });
    }
    return ret;
  }
  function semAbgOp(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.opcodes.push({
        type: id.ABG,
      });
    }
    return ret;
  }
  function semAenOp(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.opcodes.push({
        type: id.AEN,
      });
    }
    return ret;
  }
  function semBkaOp(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.opcodes.push({
        type: id.BKA,
      });
    }
    return ret;
  }
  function semBknOp(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.opcodes.push({
        type: id.BKN,
      });
    }
    return ret;
  }
  function semBkrOp(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_PRE) {
      data.ci = true; /* default to case insensitive */
      data.cs = false;
      data.um = true;
      data.pm = false;
    } else if (state === id.SEM_POST) {
      data.opcodes.push({
        type: id.BKR,
        bkrCase: data.cs === true ? id.BKR_MODE_CS : id.BKR_MODE_CI,
        bkrMode: data.pm === true ? id.BKR_MODE_PM : id.BKR_MODE_UM,
        /* NOTE: this is temporary info, index will be replaced with integer later. */
        /* Probably not the best coding practice but here you go. */
        index: {
          phraseIndex: data.bkrname.phraseIndex,
          name: apglib.utils.charsToString(chars, data.bkrname.phraseIndex, data.bkrname.phraseLength),
        },
      });
    }
    return ret;
  }
  function semBkrCi(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.ci = true;
    }
    return ret;
  }
  function semBkrCs(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.cs = true;
    }
    return ret;
  }
  function semBkrUm(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.um = true;
    }
    return ret;
  }
  function semBkrPm(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.pm = true;
    }
    return ret;
  }
  function semBkrName(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.bkrname = {
        phraseIndex,
        phraseLength: phraseCount,
      };
    }
    return ret;
  }
  function semUdtEmpty(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      const name = apglib.utils.charsToString(chars, phraseIndex, phraseCount);
      let udtName = data.udtNames.add(name);
      if (udtName === -1) {
        udtName = data.udtNames.get(name);
        if (udtName === -1) {
          throw new Error('semUdtEmpty: name look up error');
        }
      } else {
        data.udts.push({
          name: udtName.name,
          lower: udtName.lower,
          index: udtName.index,
          empty: true,
        });
      }
      data.opcodes.push({
        type: id.UDT,
        empty: true,
        index: udtName.index,
      });
    }
    return ret;
  }
  function semUdtNonEmpty(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      const name = apglib.utils.charsToString(chars, phraseIndex, phraseCount);
      let udtName = data.udtNames.add(name);
      if (udtName === -1) {
        udtName = data.udtNames.get(name);
        if (udtName === -1) {
          throw new Error('semUdtNonEmpty: name look up error');
        }
      } else {
        data.udts.push({
          name: udtName.name,
          lower: udtName.lower,
          index: udtName.index,
          empty: false,
        });
      }
      data.opcodes.push({
        type: id.UDT,
        empty: false,
        index: udtName.index,
        syntax: null,
        semantic: null,
      });
    }
    return ret;
  }
  function semTlsOp(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_PRE) {
      data.tlscase = true; /* default to case insensitive */
    }
    return ret;
  }
  function semTlsCase(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      if (phraseCount > 0 && (chars[phraseIndex + 1] === 83 || chars[phraseIndex + 1] === 115)) {
        data.tlscase = false; /* set to case sensitive */
      }
    }
    return ret;
  }
  function semTlsString(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      if (data.tlscase) {
        const str = chars.slice(phraseIndex, phraseIndex + phraseCount);
        for (let i = 0; i < str.length; i += 1) {
          if (str[i] >= 65 && str[i] <= 90) {
            str[i] += 32;
          }
        }
        data.opcodes.push({
          type: id.TLS,
          string: str,
        });
      } else {
        data.opcodes.push({
          type: id.TBS,
          string: chars.slice(phraseIndex, phraseIndex + phraseCount),
        });
      }
    }
    return ret;
  }
  function semClsOp(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      if (phraseCount <= 2) {
        /* only TLS is allowed to be empty */
        data.opcodes.push({
          type: id.TLS,
          string: [],
        });
      } else {
        data.opcodes.push({
          type: id.TBS,
          string: chars.slice(phraseIndex + 1, phraseIndex + phraseCount - 1),
        });
      }
    }
    return ret;
  }
  function semTbsOp(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_PRE) {
      data.tbsstr = [];
    } else if (state === id.SEM_POST) {
      data.opcodes.push({
        type: id.TBS,
        string: data.tbsstr,
      });
    }
    return ret;
  }
  function semTrgOp(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_PRE) {
      data.min = 0;
      data.max = 0;
    } else if (state === id.SEM_POST) {
      if (data.min > data.max) {
        data.errors.push({
          line: data.findLine(data.lines, phraseIndex, data.charsLength),
          char: phraseIndex,
          msg: `TRG, (%dmin-max), min cannot be greater than max: min: ${data.min}: max: ${data.max}`,
        });
      }
      data.opcodes.push({
        type: id.TRG,
        min: data.min,
        max: data.max,
      });
    }
    return ret;
  }
  function semDmin(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.min = decnum(chars, phraseIndex, phraseCount);
    }
    return ret;
  }
  function semDmax(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.max = decnum(chars, phraseIndex, phraseCount);
    }
    return ret;
  }
  function semBmin(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.min = binnum(chars, phraseIndex, phraseCount);
    }
    return ret;
  }
  function semBmax(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.max = binnum(chars, phraseIndex, phraseCount);
    }
    return ret;
  }
  function semXmin(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.min = hexnum(chars, phraseIndex, phraseCount);
    }
    return ret;
  }
  function semXmax(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.max = hexnum(chars, phraseIndex, phraseCount);
    }
    return ret;
  }
  function semDstring(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.tbsstr.push(decnum(chars, phraseIndex, phraseCount));
    }
    return ret;
  }
  function semBstring(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.tbsstr.push(binnum(chars, phraseIndex, phraseCount));
    }
    return ret;
  }
  function semXstring(state, chars, phraseIndex, phraseCount, data) {
    const ret = id.SEM_OK;
    if (state === id.SEM_POST) {
      data.tbsstr.push(hexnum(chars, phraseIndex, phraseCount));
    }
    return ret;
  }
  // Define the callback functions to the AST object.
  this.callbacks = [];
  this.callbacks.abgop = semAbgOp;
  this.callbacks.aenop = semAenOp;
  this.callbacks.alternation = semAlternation;
  this.callbacks.andop = semAndOp;
  this.callbacks.bmax = semBmax;
  this.callbacks.bmin = semBmin;
  this.callbacks.bkaop = semBkaOp;
  this.callbacks.bknop = semBknOp;
  this.callbacks.bkrop = semBkrOp;
  this.callbacks['bkr-name'] = semBkrName;
  this.callbacks.bstring = semBstring;
  this.callbacks.clsop = semClsOp;
  this.callbacks.ci = semBkrCi;
  this.callbacks.cs = semBkrCs;
  this.callbacks.um = semBkrUm;
  this.callbacks.pm = semBkrPm;
  this.callbacks.concatenation = semConcatenation;
  this.callbacks.defined = semDefined;
  this.callbacks.dmax = semDmax;
  this.callbacks.dmin = semDmin;
  this.callbacks.dstring = semDstring;
  this.callbacks.file = semFile;
  this.callbacks.incalt = semIncAlt;
  this.callbacks.notop = semNotOp;
  this.callbacks.optionopen = semOptionOpen;
  this.callbacks['rep-max'] = semRepMax;
  this.callbacks['rep-min'] = semRepMin;
  this.callbacks['rep-min-max'] = semRepMinMax;
  this.callbacks.repetition = semRepetition;
  this.callbacks.repop = semRepOp;
  this.callbacks.rnmop = semRnmOp;
  this.callbacks.rule = semRule;
  this.callbacks.rulelookup = semRuleLookup;
  this.callbacks.rulename = semRuleName;
  this.callbacks.tbsop = semTbsOp;
  this.callbacks.tlscase = semTlsCase;
  this.callbacks.tlsstring = semTlsString;
  this.callbacks.tlsop = semTlsOp;
  this.callbacks.trgop = semTrgOp;
  this.callbacks['udt-empty'] = semUdtEmpty;
  this.callbacks['udt-non-empty'] = semUdtNonEmpty;
  this.callbacks.xmax = semXmax;
  this.callbacks.xmin = semXmin;
  this.callbacks.xstring = semXstring;
};
