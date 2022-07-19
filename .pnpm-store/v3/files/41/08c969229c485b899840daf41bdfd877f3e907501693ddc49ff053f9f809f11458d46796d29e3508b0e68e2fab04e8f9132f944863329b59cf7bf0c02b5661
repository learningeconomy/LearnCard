/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This module converts an input SABNF grammar text file into a
// grammar object that can be used with `apg-lib` in an application parser.
// **apg** is, in fact itself, an ABNF parser that generates an SABNF parser.
// It is based on the grammar<br>
// `./dist/abnf-for-sabnf-grammar.bnf`.<br>
// In its syntax phase, **apg** analyzes the user's input SABNF grammar for correct syntax, generating an AST as it goes.
// In its semantic phase, **apg** translates the AST to generate the parser for the input grammar.
module.exports = function exportParser() {
  const thisFileName = 'parser: ';
  const ApgLib = require('../apg-lib/node-exports');
  const id = ApgLib.ids;
  const syn = new (require('./syntax-callbacks'))();
  const sem = new (require('./semantic-callbacks'))();
  const sabnfGrammar = new (require('./sabnf-grammar'))();
  // eslint-disable-next-line new-cap
  const parser = new ApgLib.parser();
  // eslint-disable-next-line new-cap
  parser.ast = new ApgLib.ast();
  parser.callbacks = syn.callbacks;
  parser.ast.callbacks = sem.callbacks;

  /* find the line containing the given character index */
  const findLine = function findLine(lines, charIndex, charLength) {
    if (charIndex < 0 || charIndex >= charLength) {
      /* return error if out of range */
      return -1;
    }
    for (let i = 0; i < lines.length; i += 1) {
      if (charIndex >= lines[i].beginChar && charIndex < lines[i].beginChar + lines[i].length) {
        return i;
      }
    }
    /* should never reach here */
    return -1;
  };
  const translateIndex = function translateIndex(map, index) {
    let ret = -1;
    if (index < map.length) {
      for (let i = index; i < map.length; i += 1) {
        if (map[i] !== null) {
          ret = map[i];
          break;
        }
      }
    }
    return ret;
  };
  /* helper function when removing redundant opcodes */
  const reduceOpcodes = function reduceOpcodes(rules) {
    rules.forEach((rule) => {
      const opcodes = [];
      const map = [];
      let reducedIndex = 0;
      rule.opcodes.forEach((op) => {
        if (op.type === id.ALT && op.children.length === 1) {
          map.push(null);
        } else if (op.type === id.CAT && op.children.length === 1) {
          map.push(null);
        } else if (op.type === id.REP && op.min === 1 && op.max === 1) {
          map.push(null);
        } else {
          map.push(reducedIndex);
          opcodes.push(op);
          reducedIndex += 1;
        }
      });
      map.push(reducedIndex);
      /* translate original opcode indexes to the reduced set. */
      opcodes.forEach((op) => {
        if (op.type === id.ALT || op.type === id.CAT) {
          for (let i = 0; i < op.children.length; i += 1) {
            op.children[i] = translateIndex(map, op.children[i]);
          }
        }
      });
      rule.opcodes = opcodes;
    });
  };
  /* Parse the grammar - the syntax phase. */
  /* SABNF grammar syntax errors are caught and reported here. */
  this.syntax = function syntax(chars, lines, errors, strict, trace) {
    if (trace) {
      if (trace.traceObject !== 'traceObject') {
        throw new TypeError(`${thisFileName}trace argument is not a trace object`);
      }
      parser.trace = trace;
    }
    const data = {};
    data.errors = errors;
    data.strict = !!strict;
    data.lines = lines;
    data.findLine = findLine;
    data.charsLength = chars.length;
    data.ruleCount = 0;
    const result = parser.parse(sabnfGrammar, 'file', chars, data);
    if (!result.success) {
      errors.push({
        line: 0,
        char: 0,
        msg: 'syntax analysis of input grammar failed',
      });
    }
  };
  /* Parse the grammar - the semantic phase, translates the AST. */
  /* SABNF grammar syntax errors are caught and reported here. */
  this.semantic = function semantic(chars, lines, errors) {
    const data = {};
    data.errors = errors;
    data.lines = lines;
    data.findLine = findLine;
    data.charsLength = chars.length;
    parser.ast.translate(data);
    if (errors.length) {
      return null;
    }
    /* Remove unneeded operators. */
    /* ALT operators with a single alternate */
    /* CAT operators with a single phrase to concatenate */
    /* REP(1,1) operators (`1*1RuleName` or `1RuleName` is the same as just `RuleName`.) */
    reduceOpcodes(data.rules);
    return {
      rules: data.rules,
      udts: data.udts,
      lineMap: data.rulesLineMap,
    };
  };
  // Generate a grammar constructor function.
  // An object instantiated from this constructor is used with the `apg-lib` `parser()` function.
  this.generateSource = function generateSource(chars, lines, rules, udts, name) {
    let source = '';
    let i;
    let bkrname;
    let bkrlower;
    let opcodeCount = 0;
    let charCodeMin = Infinity;
    let charCodeMax = 0;
    const ruleNames = [];
    const udtNames = [];
    let alt = 0;
    let cat = 0;
    let rnm = 0;
    let udt = 0;
    let rep = 0;
    let and = 0;
    let not = 0;
    let tls = 0;
    let tbs = 0;
    let trg = 0;
    let bkr = 0;
    let bka = 0;
    let bkn = 0;
    let abg = 0;
    let aen = 0;
    rules.forEach((rule) => {
      ruleNames.push(rule.lower);
      opcodeCount += rule.opcodes.length;
      rule.opcodes.forEach((op) => {
        switch (op.type) {
          case id.ALT:
            alt += 1;
            break;
          case id.CAT:
            cat += 1;
            break;
          case id.RNM:
            rnm += 1;
            break;
          case id.UDT:
            udt += 1;
            break;
          case id.REP:
            rep += 1;
            break;
          case id.AND:
            and += 1;
            break;
          case id.NOT:
            not += 1;
            break;
          case id.BKA:
            bka += 1;
            break;
          case id.BKN:
            bkn += 1;
            break;
          case id.BKR:
            bkr += 1;
            break;
          case id.ABG:
            abg += 1;
            break;
          case id.AEN:
            aen += 1;
            break;
          case id.TLS:
            tls += 1;
            for (i = 0; i < op.string.length; i += 1) {
              if (op.string[i] < charCodeMin) {
                charCodeMin = op.string[i];
              }
              if (op.string[i] > charCodeMax) {
                charCodeMax = op.string[i];
              }
            }
            break;
          case id.TBS:
            tbs += 1;
            for (i = 0; i < op.string.length; i += 1) {
              if (op.string[i] < charCodeMin) {
                charCodeMin = op.string[i];
              }
              if (op.string[i] > charCodeMax) {
                charCodeMax = op.string[i];
              }
            }
            break;
          case id.TRG:
            trg += 1;
            if (op.min < charCodeMin) {
              charCodeMin = op.min;
            }
            if (op.max > charCodeMax) {
              charCodeMax = op.max;
            }
            break;
          default:
            throw new Error('generateSource: unrecognized opcode');
        }
      });
    });
    ruleNames.sort();
    if (udts.length > 0) {
      udts.forEach((udtFunc) => {
        udtNames.push(udtFunc.lower);
      });
      udtNames.sort();
    }
    let funcname = 'module.exports';
    if (name && typeof name === 'string') {
      funcname = `let ${name}`;
    }
    source += '// copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved<br>\n';
    source += '//   license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)<br>\n';
    source += '//\n';
    source += '// Generated by apg-js, Version 4.0.0 [apg-js](https://github.com/ldthomas/apg-js)\n';
    source += `${funcname} = function grammar(){\n`;
    source += '  // ```\n';
    source += '  // SUMMARY\n';
    source += `  //      rules = ${rules.length}\n`;
    source += `  //       udts = ${udts.length}\n`;
    source += `  //    opcodes = ${opcodeCount}\n`;
    source += '  //        ---   ABNF original opcodes\n';
    source += `  //        ALT = ${alt}\n`;
    source += `  //        CAT = ${cat}\n`;
    source += `  //        REP = ${rep}\n`;
    source += `  //        RNM = ${rnm}\n`;
    source += `  //        TLS = ${tls}\n`;
    source += `  //        TBS = ${tbs}\n`;
    source += `  //        TRG = ${trg}\n`;
    source += '  //        ---   SABNF superset opcodes\n';
    source += `  //        UDT = ${udt}\n`;
    source += `  //        AND = ${and}\n`;
    source += `  //        NOT = ${not}\n`;
    source += `  //        BKA = ${bka}\n`;
    source += `  //        BKN = ${bkn}\n`;
    source += `  //        BKR = ${bkr}\n`;
    source += `  //        ABG = ${abg}\n`;
    source += `  //        AEN = ${aen}\n`;
    source += '  // characters = [';
    if (tls + tbs + trg === 0) {
      source += ' none defined ]';
    } else {
      source += `${charCodeMin} - ${charCodeMax}]`;
    }
    if (udt > 0) {
      source += ' + user defined';
    }
    source += '\n';
    source += '  // ```\n';
    source += '  /* OBJECT IDENTIFIER (for internal parser use) */\n';
    source += "  this.grammarObject = 'grammarObject';\n";
    source += '\n';
    source += '  /* RULES */\n';
    source += '  this.rules = [];\n';
    rules.forEach((rule, ii) => {
      let thisRule = '  this.rules[';
      thisRule += ii;
      thisRule += "] = {name: '";
      thisRule += rule.name;
      thisRule += "', lower: '";
      thisRule += rule.lower;
      thisRule += "', index: ";
      thisRule += rule.index;
      thisRule += ', isBkr: ';
      thisRule += rule.isBkr;
      thisRule += '};\n';
      source += thisRule;
    });
    source += '\n';
    source += '  /* UDTS */\n';
    source += '  this.udts = [];\n';
    if (udts.length > 0) {
      udts.forEach((udtFunc, ii) => {
        let thisUdt = '  this.udts[';
        thisUdt += ii;
        thisUdt += "] = {name: '";
        thisUdt += udtFunc.name;
        thisUdt += "', lower: '";
        thisUdt += udtFunc.lower;
        thisUdt += "', index: ";
        thisUdt += udtFunc.index;
        thisUdt += ', empty: ';
        thisUdt += udtFunc.empty;
        thisUdt += ', isBkr: ';
        thisUdt += udtFunc.isBkr;
        thisUdt += '};\n';
        source += thisUdt;
      });
    }
    source += '\n';
    source += '  /* OPCODES */\n';
    rules.forEach((rule, ruleIndex) => {
      if (ruleIndex > 0) {
        source += '\n';
      }
      source += `  /* ${rule.name} */\n`;
      source += `  this.rules[${ruleIndex}].opcodes = [];\n`;
      rule.opcodes.forEach((op, opIndex) => {
        let prefix;
        switch (op.type) {
          case id.ALT:
            source += `  this.rules[${ruleIndex}].opcodes[${opIndex}] = {type: ${
              op.type
            }, children: [${op.children.toString()}]};// ALT\n`;
            break;
          case id.CAT:
            source += `  this.rules[${ruleIndex}].opcodes[${opIndex}] = {type: ${
              op.type
            }, children: [${op.children.toString()}]};// CAT\n`;
            break;
          case id.RNM:
            source += `  this.rules[${ruleIndex}].opcodes[${opIndex}] = {type: ${op.type}, index: ${op.index}};// RNM(${
              rules[op.index].name
            })\n`;
            break;
          case id.BKR:
            if (op.index >= rules.length) {
              bkrname = udts[op.index - rules.length].name;
              bkrlower = udts[op.index - rules.length].lower;
            } else {
              bkrname = rules[op.index].name;
              bkrlower = rules[op.index].lower;
            }
            prefix = '%i';
            if (op.bkrCase === id.BKR_MODE_CS) {
              prefix = '%s';
            }
            if (op.bkrMode === id.BKR_MODE_UM) {
              prefix += '%u';
            } else {
              prefix += '%p';
            }
            bkrname = prefix + bkrname;
            source +=
              `  this.rules[${ruleIndex}].opcodes[${opIndex}] = {type: ${op.type}, index: ${op.index}, lower: '${bkrlower}'` +
              `, bkrCase: ${op.bkrCase}, bkrMode: ${op.bkrMode}};// BKR(\\${bkrname})\n`;
            break;
          case id.UDT:
            source += `  this.rules[${ruleIndex}].opcodes[${opIndex}] = {type: ${op.type}, empty: ${op.empty}, index: ${
              op.index
            }};// UDT(${udts[op.index].name})\n`;
            break;
          case id.REP:
            source += `  this.rules[${ruleIndex}].opcodes[${opIndex}] = {type: ${op.type}, min: ${op.min}, max: ${op.max}};// REP\n`;
            break;
          case id.AND:
            source += `  this.rules[${ruleIndex}].opcodes[${opIndex}] = {type: ${op.type}};// AND\n`;
            break;
          case id.NOT:
            source += `  this.rules[${ruleIndex}].opcodes[${opIndex}] = {type: ${op.type}};// NOT\n`;
            break;
          case id.ABG:
            source += `  this.rules[${ruleIndex}].opcodes[${opIndex}] = {type: ${op.type}};// ABG(%^)\n`;
            break;
          case id.AEN:
            source += `  this.rules[${ruleIndex}].opcodes[${opIndex}] = {type: ${op.type}};// AEN(%$)\n`;
            break;
          case id.BKA:
            source += `  this.rules[${ruleIndex}].opcodes[${opIndex}] = {type: ${op.type}};// BKA\n`;
            break;
          case id.BKN:
            source += `  this.rules[${ruleIndex}].opcodes[${opIndex}] = {type: ${op.type}};// BKN\n`;
            break;
          case id.TLS:
            source += `  this.rules[${ruleIndex}].opcodes[${opIndex}] = {type: ${
              op.type
            }, string: [${op.string.toString()}]};// TLS\n`;
            break;
          case id.TBS:
            source += `  this.rules[${ruleIndex}].opcodes[${opIndex}] = {type: ${
              op.type
            }, string: [${op.string.toString()}]};// TBS\n`;
            break;
          case id.TRG:
            source += `  this.rules[${ruleIndex}].opcodes[${opIndex}] = {type: ${op.type}, min: ${op.min}, max: ${op.max}};// TRG\n`;
            break;
          default:
            throw new Error('parser.js: ~143: unrecognized opcode');
        }
      });
    });
    source += '\n';
    source += '  // The `toString()` function will display the original grammar file(s) that produced these opcodes.\n';
    source += '  this.toString = function toString(){\n';
    source += '    let str = "";\n';
    let str;
    lines.forEach((line) => {
      const end = line.beginChar + line.length;
      str = '';
      source += '    str += "';
      for (let ii = line.beginChar; ii < end; ii += 1) {
        switch (chars[ii]) {
          case 9:
            str = ' ';
            break;
          case 10:
            str = '\\n';
            break;
          case 13:
            str = '\\r';
            break;
          case 34:
            str = '\\"';
            break;
          case 92:
            str = '\\\\';
            break;
          default:
            str = String.fromCharCode(chars[ii]);
            break;
        }
        source += str;
      }
      source += '";\n';
    });
    source += '    return str;\n';
    source += '  }\n';
    source += '}\n';
    return source;
  };
  // Generate a grammar file object.
  // Returns the same object as instantiating the constructor function returned by<br>
  // `this.generateSource()`.<br>
  this.generateObject = function generateObject(stringArg, rules, udts) {
    const obj = {};
    const ruleNames = [];
    const udtNames = [];
    const string = stringArg.slice(0);
    obj.grammarObject = 'grammarObject';
    rules.forEach((rule) => {
      ruleNames.push(rule.lower);
    });
    ruleNames.sort();
    if (udts.length > 0) {
      udts.forEach((udtFunc) => {
        udtNames.push(udtFunc.lower);
      });
      udtNames.sort();
    }
    obj.callbacks = [];
    ruleNames.forEach((name) => {
      obj.callbacks[name] = false;
    });
    if (udts.length > 0) {
      udtNames.forEach((name) => {
        obj.callbacks[name] = false;
      });
    }
    obj.rules = rules;
    obj.udts = udts;
    obj.toString = function toStringFunc() {
      return string;
    };
    return obj;
  };
};
