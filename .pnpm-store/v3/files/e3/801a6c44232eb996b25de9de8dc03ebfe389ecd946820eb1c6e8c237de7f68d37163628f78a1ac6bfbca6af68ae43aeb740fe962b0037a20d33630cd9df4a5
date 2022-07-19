/* eslint-disable func-names */
/* eslint-disable no-restricted-syntax */
/* eslint-disable new-cap */
/* eslint-disable guard-for-in */
/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This is the primary object of `apg-lib`. Calling its `parse()` member function
// walks the parse tree of opcodes, matching phrases from the input string as it goes.
// The working code for all of the operators, `ALT`, `CAT`, etc. is in this module.
module.exports = function parser() {
  const id = require('./identifiers');
  const utils = require('./utilities');

  const thisFileName = 'parser.js: ';
  const thisThis = this;
  let opExecute;
  this.ast = null;
  this.stats = null;
  this.trace = null;
  this.callbacks = [];
  let opcodes = null;
  let chars = null;
  let charsBegin;
  let charsLength;
  let charsEnd;
  let lookAround;
  let treeDepth = 0;
  let maxTreeDepth = 0;
  let nodeHits = 0;
  let ruleCallbacks = null;
  let udtCallbacks = null;
  let rules = null;
  let udts = null;
  let syntaxData = null;
  let maxMatched = 0;
  let limitTreeDepth = Infinity;
  let limitNodeHits = Infinity;
  // Evaluates any given rule. This can be called from the syntax callback
  // functions to evaluate any rule in the grammar's rule list. Great caution
  // should be used. Use of this function will alter the language that the
  // parser accepts.
  const evaluateRule = function evaluateRule(ruleIndex, phraseIndex, sysData) {
    const functionName = `${thisFileName}evaluateRule(): `;
    if (ruleIndex >= rules.length) {
      throw new Error(`${functionName}rule index: ${ruleIndex} out of range`);
    }
    if (phraseIndex >= charsEnd) {
      throw new Error(`${functionName}phrase index: ${phraseIndex} out of range`);
    }
    const { length } = opcodes;
    opcodes.push({
      type: id.RNM,
      index: ruleIndex,
    });
    opExecute(length, phraseIndex, sysData);
    opcodes.pop();
  };
  // Evaluates any given UDT. This can be called from the syntax callback
  // functions to evaluate any UDT in the grammar's UDT list. Great caution
  // should be used. Use of this function will alter the language that the
  // parser accepts.
  const evaluateUdt = function (udtIndex, phraseIndex, sysData) {
    const functionName = `${thisFileName}evaluateUdt(): `;
    if (udtIndex >= udts.length) {
      throw new Error(`${functionName}udt index: ${udtIndex} out of range`);
    }
    if (phraseIndex >= charsEnd) {
      throw new Error(`${functionName}phrase index: ${phraseIndex} out of range`);
    }
    const { length } = opcodes;
    opcodes.push({
      type: id.UDT,
      empty: udts[udtIndex].empty,
      index: udtIndex,
    });
    opExecute(length, phraseIndex, sysData);
    opcodes.pop();
  };
  /* Clears this object of any/all data that has been initialized or added to it. */
  /* Called by parse() on initialization, allowing this object to be re-used for multiple parsing calls. */
  const clear = function () {
    treeDepth = 0;
    maxTreeDepth = 0;
    nodeHits = 0;
    maxMatched = 0;
    lookAround = [
      {
        lookAround: id.LOOKAROUND_NONE,
        anchor: 0,
        charsEnd: 0,
        charsLength: 0,
      },
    ];
    rules = null;
    udts = null;
    chars = null;
    charsBegin = 0;
    charsLength = 0;
    charsEnd = 0;
    ruleCallbacks = null;
    udtCallbacks = null;
    syntaxData = null;
    opcodes = null;
  };
  /* object for maintaining a stack of back reference frames */
  const backRef = function () {
    const stack = [];
    const init = function () {
      const obj = {};
      rules.forEach((rule) => {
        if (rule.isBkr) {
          obj[rule.lower] = null;
        }
      });
      if (udts.length > 0) {
        udts.forEach((udt) => {
          if (udt.isBkr) {
            obj[udt.lower] = null;
          }
        });
      }
      stack.push(obj);
    };
    const copy = function () {
      const top = stack[stack.length - 1];
      const obj = {};
      /* // eslint-disable-next-line no-restricted-syntax */
      for (const name in top) {
        obj[name] = top[name];
      }
      return obj;
    };
    this.push = function push() {
      stack.push(copy());
    };
    this.pop = function pop(lengthArg) {
      let length = lengthArg;
      if (!length) {
        length = stack.length - 1;
      }
      if (length < 1 || length > stack.length) {
        throw new Error(`${thisFileName}backRef.pop(): bad length: ${length}`);
      }
      stack.length = length;
      return stack[stack.length - 1];
    };
    this.length = function length() {
      return stack.length;
    };
    this.savePhrase = function savePhrase(name, index, length) {
      stack[stack.length - 1][name] = {
        phraseIndex: index,
        phraseLength: length,
      };
    };
    this.getPhrase = function (name) {
      return stack[stack.length - 1][name];
    };
    /* constructor */
    init();
  };
  // The system data structure that relays system information to and from the rule and UDT callback functions.
  // - *state* - the state of the parser, ACTIVE, MATCH, EMPTY or NOMATCH (see the `identifiers` object in
  // [`apg-lib`](https://github.com/ldthomas/apg-js2-lib))
  // - *phraseLength* - the number of characters matched if the state is MATCHED or EMPTY
  // - *lookaround* - the top of the stack holds the current look around state,
  // LOOKAROUND_NONE, LOOKAROUND_AHEAD or LOOKAROUND_BEHIND,
  // - *uFrame* - the "universal" back reference frame.
  // Holds the last matched phrase for each of the back referenced rules and UDTs.
  // - *pFrame* - the stack of "parent" back reference frames.
  // Holds the matched phrase from the parent frame of each back referenced rules and UDTs.
  // - *evaluateRule* - a reference to this object's `evaluateRule()` function.
  // Can be called from a callback function (use with extreme caution!)
  // - *evaluateUdt* - a reference to this object's `evaluateUdt()` function.
  // Can be called from a callback function (use with extreme caution!)
  const systemData = function systemData() {
    const thisData = this;
    this.state = id.ACTIVE;
    this.phraseLength = 0;
    this.ruleIndex = 0;
    this.udtIndex = 0;
    this.lookAround = lookAround[lookAround.length - 1];
    this.uFrame = new backRef();
    this.pFrame = new backRef();
    this.evaluateRule = evaluateRule;
    this.evaluateUdt = evaluateUdt;
    /* refresh the parser state for the next operation */
    this.refresh = function refresh() {
      thisData.state = id.ACTIVE;
      thisData.phraseLength = 0;
      thisData.lookAround = lookAround[lookAround.length - 1];
    };
  };
  /* some look around helper functions */
  const lookAroundValue = function lookAroundValue() {
    return lookAround[lookAround.length - 1];
  };
  /* return true if parser is in look around (ahead or behind) state */
  const inLookAround = function inLookAround() {
    return lookAround.length > 1;
  };
  /* return true if parser is in look behind state */
  const inLookBehind = function () {
    return lookAround[lookAround.length - 1].lookAround === id.LOOKAROUND_BEHIND;
  };
  /* called by parse() to initialize the AST object, if one has been defined */
  const initializeAst = function () {
    const functionName = `${thisFileName}initializeAst(): `;
    const TRUE = true;
    while (TRUE) {
      if (thisThis.ast === undefined) {
        thisThis.ast = null;
        break;
      }
      if (thisThis.ast === null) {
        break;
      }
      if (thisThis.ast.astObject !== 'astObject') {
        throw new Error(`${functionName}ast object not recognized`);
      }
      break;
    }
    if (thisThis.ast !== null) {
      thisThis.ast.init(rules, udts, chars);
    }
  };
  /* called by parse() to initialize the trace object, if one has been defined */
  const initializeTrace = function () {
    const functionName = `${thisFileName}initializeTrace(): `;
    const TRUE = true;
    while (TRUE) {
      if (thisThis.trace === undefined) {
        thisThis.trace = null;
        break;
      }
      if (thisThis.trace === null) {
        break;
      }
      if (thisThis.trace.traceObject !== 'traceObject') {
        throw new Error(`${functionName}trace object not recognized`);
      }
      break;
    }
    if (thisThis.trace !== null) {
      thisThis.trace.init(rules, udts, chars);
    }
  };
  /* called by parse() to initialize the statistics object, if one has been defined */
  const initializeStats = function () {
    const functionName = `${thisFileName}initializeStats(): `;
    const TRUE = true;
    while (TRUE) {
      if (thisThis.stats === undefined) {
        thisThis.stats = null;
        break;
      }
      if (thisThis.stats === null) {
        break;
      }
      if (thisThis.stats.statsObject !== 'statsObject') {
        throw new Error(`${functionName}stats object not recognized`);
      }
      break;
    }
    if (thisThis.stats !== null) {
      thisThis.stats.init(rules, udts);
    }
  };
  /* called by parse() to initialize the rules & udts from the grammar object */
  /* (the grammar object generated previously by apg) */
  const initializeGrammar = function (grammar) {
    const functionName = `${thisFileName}initializeGrammar(): `;
    if (!grammar) {
      throw new Error(`${functionName}grammar object undefined`);
    }
    if (grammar.grammarObject !== 'grammarObject') {
      throw new Error(`${functionName}bad grammar object`);
    }
    rules = grammar.rules;
    udts = grammar.udts;
  };
  /* called by parse() to initialize the start rule */
  const initializeStartRule = function (startRule) {
    const functionName = `${thisFileName}initializeStartRule(): `;
    let start = null;
    if (typeof startRule === 'number') {
      if (startRule >= rules.length) {
        throw new Error(`${functionName}start rule index too large: max: ${rules.length}: index: ${startRule}`);
      }
      start = startRule;
    } else if (typeof startRule === 'string') {
      const lower = startRule.toLowerCase();
      for (let i = 0; i < rules.length; i += 1) {
        if (lower === rules[i].lower) {
          start = rules[i].index;
          break;
        }
      }
      if (start === null) {
        throw new Error(`${functionName}start rule name '${startRule}' not recognized`);
      }
    } else {
      throw new Error(`${functionName}type of start rule '${typeof startRule}' not recognized`);
    }
    return start;
  };
  /* called by parse() to initialize the array of characters codes representing the input string */
  const initializeInputChars = function initializeInputChars(inputArg, begArg, lenArg) {
    const functionName = `${thisFileName}initializeInputChars(): `;
    /* varify and normalize input */
    let input = inputArg;
    let beg = begArg;
    let len = lenArg;
    if (input === undefined) {
      throw new Error(`${functionName}input string is undefined`);
    }
    if (input === null) {
      throw new Error(`${functionName}input string is null`);
    }
    if (typeof input === 'string') {
      input = utils.stringToChars(input);
    } else if (!Array.isArray(input)) {
      throw new Error(`${functionName}input string is not a string or array`);
    }
    if (input.length > 0) {
      if (typeof input[0] !== 'number') {
        throw new Error(`${functionName}input string not an array of integers`);
      }
    }
    /* verify and normalize beginning index */
    if (typeof beg !== 'number') {
      beg = 0;
    } else {
      beg = Math.floor(beg);
      if (beg < 0 || beg > input.length) {
        throw new Error(`${functionName}input beginning index out of range: ${beg}`);
      }
    }
    /* verify and normalize input length */
    if (typeof len !== 'number') {
      len = input.length - beg;
    } else {
      len = Math.floor(len);
      if (len < 0 || len > input.length - beg) {
        throw new Error(`${functionName}input length out of range: ${len}`);
      }
    }
    chars = input;
    charsBegin = beg;
    charsLength = len;
    charsEnd = charsBegin + charsLength;
  };
  /* called by parse() to initialize the user-written, syntax callback functions, if any */
  const initializeCallbacks = function () {
    const functionName = `${thisFileName}initializeCallbacks(): `;
    let i;
    ruleCallbacks = [];
    udtCallbacks = [];
    for (i = 0; i < rules.length; i += 1) {
      ruleCallbacks[i] = null;
    }
    for (i = 0; i < udts.length; i += 1) {
      udtCallbacks[i] = null;
    }
    let func;
    const list = [];
    for (i = 0; i < rules.length; i += 1) {
      list.push(rules[i].lower);
    }
    for (i = 0; i < udts.length; i += 1) {
      list.push(udts[i].lower);
    }
    for (const index in thisThis.callbacks) {
      i = list.indexOf(index.toLowerCase());
      if (i < 0) {
        throw new Error(`${functionName}syntax callback '${index}' not a rule or udt name`);
      }
      func = thisThis.callbacks[index];
      if (!func) {
        func = null;
      }
      if (typeof func === 'function' || func === null) {
        if (i < rules.length) {
          ruleCallbacks[i] = func;
        } else {
          udtCallbacks[i - rules.length] = func;
        }
      } else {
        throw new Error(
          `${functionName}syntax callback[${index}] must be function reference or 'false' (false/null/undefined/etc.)`
        );
      }
    }
    /* make sure all udts have been defined - the parser can't work without them */
    for (i = 0; i < udts.length; i += 1) {
      if (udtCallbacks[i] === null) {
        throw new Error(
          `${functionName}all UDT callbacks must be defined. UDT callback[${udts[i].lower}] not a function reference`
        );
      }
    }
  };
  // Set the maximum parse tree depth allowed. The default is `Infinity`.
  // A limit is not normally needed, but can be used to protect against an
  // exponentual or "catastrophically backtracking" grammar.
  // <ul>
  // <li>
  // depth - max allowed parse tree depth. An exception is thrown if exceeded.
  // </li>
  // </ul>
  this.setMaxTreeDepth = function (depth) {
    if (typeof depth !== 'number') {
      throw new Error(`parser: max tree depth must be integer > 0: ${depth}`);
    }
    limitTreeDepth = Math.floor(depth);
    if (limitTreeDepth <= 0) {
      throw new Error(`parser: max tree depth must be integer > 0: ${depth}`);
    }
  };
  // Set the maximum number of node hits (parser unit steps or opcode function calls) allowed.
  // The default is `Infinity`.
  // A limit is not normally needed, but can be used to protect against an
  // exponentual or "catastrophically backtracking" grammar.
  // <ul>
  // <li>
  // hits - maximum number of node hits or parser unit steps allowed.
  // An exception thrown if exceeded.
  // </li>
  // </ul>
  this.setMaxNodeHits = function (hits) {
    if (typeof hits !== 'number') {
      throw new Error(`parser: max node hits must be integer > 0: ${hits}`);
    }
    limitNodeHits = Math.floor(hits);
    if (limitNodeHits <= 0) {
      throw new Error(`parser: max node hits must be integer > 0: ${hits}`);
    }
  };
  /* the main parser function */
  const privateParse = function (grammar, startRuleArg, callbackData) {
    let success;
    const functionName = `${thisFileName}parse(): `;
    initializeGrammar(grammar);
    const startRule = initializeStartRule(startRuleArg);
    initializeCallbacks();
    initializeTrace();
    initializeStats();
    initializeAst();
    const sysData = new systemData();
    if (!(callbackData === undefined || callbackData === null)) {
      syntaxData = callbackData;
    }
    /* create a dummy opcode for the start rule */
    opcodes = [
      {
        type: id.RNM,
        index: startRule,
      },
    ];
    /* execute the start rule */
    opExecute(0, charsBegin, sysData);
    opcodes = null;
    /* test and return the sysData */
    switch (sysData.state) {
      case id.ACTIVE:
        throw new Error(`${functionName}final state should never be 'ACTIVE'`);
      case id.NOMATCH:
        success = false;
        break;
      case id.EMPTY:
      case id.MATCH:
        if (sysData.phraseLength === charsLength) {
          success = true;
        } else {
          success = false;
        }
        break;
      default:
        throw new Error('unrecognized state');
    }
    return {
      success,
      state: sysData.state,
      length: charsLength,
      matched: sysData.phraseLength,
      maxMatched,
      maxTreeDepth,
      nodeHits,
      inputLength: chars.length,
      subBegin: charsBegin,
      subEnd: charsEnd,
      subLength: charsLength,
    };
  };

  // This form allows parsing of a sub-string of the full input string.
  // <ul>
  // <li>*inputIndex* - index of the first character in the sub-string</li>
  // <li>*inputLength* - length of the sub-string</li>
  // </ul>
  // All other parameters as for the above function `parse()`.
  this.parseSubstring = function parseSubstring(grammar, startRule, inputChars, inputIndex, inputLength, callbackData) {
    clear();
    initializeInputChars(inputChars, inputIndex, inputLength);
    return privateParse(grammar, startRule, callbackData);
  };
  // This is the main function, called to parse an input string.
  // <ul>
  // <li>*grammar* - an instantiated grammar object - the output of `apg` for a
  // specific SABNF grammar</li>
  // <li>*startRule* - the rule name or rule index to be used as the root of the
  // parse tree. This is usually the first rule, index = 0, of the grammar
  // but can be any rule defined in the above grammar object.</li>
  // <li>*inputChars* - the input string. Can be a string or an array of integer character codes representing the
  // string.</li>
  // <li>*callbackData* - user-defined data object to be passed to the user's
  // callback functions.
  // This is not used by the parser in any way, merely passed on to the user.
  // May be `null` or omitted.</li>
  // </ul>
  this.parse = function parse(grammar, startRule, inputChars, callbackData) {
    clear();
    initializeInputChars(inputChars, 0, inputChars.length);
    return privateParse(grammar, startRule, callbackData);
  };
  // The `ALT` operator.<br>
  // Executes its child nodes, from left to right, until it finds a match.
  // Fails if *all* of its child nodes fail.
  const opALT = function (opIndex, phraseIndex, sysData) {
    const op = opcodes[opIndex];
    for (let i = 0; i < op.children.length; i += 1) {
      opExecute(op.children[i], phraseIndex, sysData);
      if (sysData.state !== id.NOMATCH) {
        break;
      }
    }
  };
  // The `CAT` operator.<br>
  // Executes all of its child nodes, from left to right,
  // concatenating the matched phrases.
  // Fails if *any* child nodes fail.
  const opCAT = function (opIndex, phraseIndex, sysData) {
    let success;
    let astLength;
    let catCharIndex;
    let catPhrase;
    const op = opcodes[opIndex];
    const ulen = sysData.uFrame.length();
    const plen = sysData.pFrame.length();
    if (thisThis.ast) {
      astLength = thisThis.ast.getLength();
    }
    success = true;
    catCharIndex = phraseIndex;
    catPhrase = 0;
    for (let i = 0; i < op.children.length; i += 1) {
      opExecute(op.children[i], catCharIndex, sysData);
      if (sysData.state === id.NOMATCH) {
        success = false;
        break;
      } else {
        catCharIndex += sysData.phraseLength;
        catPhrase += sysData.phraseLength;
      }
    }
    if (success) {
      sysData.state = catPhrase === 0 ? id.EMPTY : id.MATCH;
      sysData.phraseLength = catPhrase;
    } else {
      sysData.state = id.NOMATCH;
      sysData.phraseLength = 0;
      /* reset the back referencing frames on failure */
      sysData.uFrame.pop(ulen);
      sysData.pFrame.pop(plen);
      if (thisThis.ast) {
        thisThis.ast.setLength(astLength);
      }
    }
  };
  // The `REP` operator.<br>
  // Repeatedly executes its single child node,
  // concatenating each of the matched phrases found.
  // The number of repetitions executed and its final sysData depends
  // on its `min` & `max` repetition values.
  const opREP = function (opIndex, phraseIndex, sysData) {
    let astLength;
    let repCharIndex;
    let repPhrase;
    let repCount;
    const op = opcodes[opIndex];
    repCharIndex = phraseIndex;
    repPhrase = 0;
    repCount = 0;
    const ulen = sysData.uFrame.length();
    const plen = sysData.pFrame.length();
    if (thisThis.ast) {
      astLength = thisThis.ast.getLength();
    }
    const TRUE = true;
    while (TRUE) {
      if (repCharIndex >= charsEnd) {
        /* exit on end of input string */
        break;
      }
      opExecute(opIndex + 1, repCharIndex, sysData);
      if (sysData.state === id.NOMATCH) {
        /* always end if the child node fails */
        break;
      }
      if (sysData.state === id.EMPTY) {
        /* REP always succeeds when the child node returns an empty phrase */
        /* this may not seem obvious, but that's the way it works out */
        break;
      }
      repCount += 1;
      repPhrase += sysData.phraseLength;
      repCharIndex += sysData.phraseLength;
      if (repCount === op.max) {
        /* end on maxed out reps */
        break;
      }
    }
    /* evaluate the match count according to the min, max values */
    if (sysData.state === id.EMPTY) {
      sysData.state = repPhrase === 0 ? id.EMPTY : id.MATCH;
      sysData.phraseLength = repPhrase;
    } else if (repCount >= op.min) {
      sysData.state = repPhrase === 0 ? id.EMPTY : id.MATCH;
      sysData.phraseLength = repPhrase;
    } else {
      sysData.state = id.NOMATCH;
      sysData.phraseLength = 0;
      /* reset the back referencing frames on failure */
      sysData.uFrame.pop(ulen);
      sysData.pFrame.pop(plen);
      if (thisThis.ast) {
        thisThis.ast.setLength(astLength);
      }
    }
  };
  // Validate the callback function's returned sysData values.
  // It's the user's responsibility to get them right
  // but `RNM` fails if not.
  const validateRnmCallbackResult = function (rule, sysData, charsLeft, down) {
    if (sysData.phraseLength > charsLeft) {
      let str = `${thisFileName}opRNM(${rule.name}): callback function error: `;
      str += `sysData.phraseLength: ${sysData.phraseLength}`;
      str += ` must be <= remaining chars: ${charsLeft}`;
      throw new Error(str);
    }
    switch (sysData.state) {
      case id.ACTIVE:
        if (down !== true) {
          throw new Error(
            `${thisFileName}opRNM(${rule.name}): callback function return error. ACTIVE state not allowed.`
          );
        }
        break;
      case id.EMPTY:
        sysData.phraseLength = 0;
        break;
      case id.MATCH:
        if (sysData.phraseLength === 0) {
          sysData.state = id.EMPTY;
        }
        break;
      case id.NOMATCH:
        sysData.phraseLength = 0;
        break;
      default:
        throw new Error(
          `${thisFileName}opRNM(${rule.name}): callback function return error. Unrecognized return state: ${sysData.state}`
        );
    }
  };
  // The `RNM` operator.<br>
  // This operator will acts as a root node for a parse tree branch below and
  // returns the matched phrase to its parent.
  // However, its larger responsibility is handling user-defined callback functions, back references and `AST` nodes.
  // Note that the `AST` is a separate object, but `RNM` calls its functions to create its nodes.
  // See [`ast.js`](./ast.html) for usage.
  const opRNM = function (opIndex, phraseIndex, sysData) {
    let astLength;
    let astDefined;
    let savedOpcodes;
    let ulen;
    let plen;
    let saveFrame;
    const op = opcodes[opIndex];
    const rule = rules[op.index];
    const callback = ruleCallbacks[rule.index];
    const notLookAround = !inLookAround();
    /* ignore AST and back references in lookaround */
    if (notLookAround) {
      /* begin AST and back references */
      astDefined = thisThis.ast && thisThis.ast.ruleDefined(op.index);
      if (astDefined) {
        astLength = thisThis.ast.getLength();
        thisThis.ast.down(op.index, rules[op.index].name);
      }
      ulen = sysData.uFrame.length();
      plen = sysData.pFrame.length();
      sysData.uFrame.push();
      sysData.pFrame.push();
      saveFrame = sysData.pFrame;
      sysData.pFrame = new backRef();
    }
    if (callback === null) {
      /* no callback - just execute the rule */
      savedOpcodes = opcodes;
      opcodes = rule.opcodes;
      opExecute(0, phraseIndex, sysData);
      opcodes = savedOpcodes;
    } else {
      /* call user's callback */
      const charsLeft = charsEnd - phraseIndex;
      sysData.ruleIndex = rule.index;
      callback(sysData, chars, phraseIndex, syntaxData);
      validateRnmCallbackResult(rule, sysData, charsLeft, true);
      if (sysData.state === id.ACTIVE) {
        savedOpcodes = opcodes;
        opcodes = rule.opcodes;
        opExecute(0, phraseIndex, sysData);
        opcodes = savedOpcodes;
        sysData.ruleIndex = rule.index;
        callback(sysData, chars, phraseIndex, syntaxData);
        validateRnmCallbackResult(rule, sysData, charsLeft, false);
      } /* implied else clause: just accept the callback sysData - RNM acting as UDT */
    }
    if (notLookAround) {
      /* end AST */
      if (astDefined) {
        if (sysData.state === id.NOMATCH) {
          thisThis.ast.setLength(astLength);
        } else {
          thisThis.ast.up(op.index, rule.name, phraseIndex, sysData.phraseLength);
        }
      }
      /* end back reference */
      sysData.pFrame = saveFrame;
      if (sysData.state === id.NOMATCH) {
        sysData.uFrame.pop(ulen);
        sysData.pFrame.pop(plen);
      } else if (rule.isBkr) {
        /* save phrase on both the parent and universal frames */
        /* BKR operator will decide which to use later */
        sysData.pFrame.savePhrase(rule.lower, phraseIndex, sysData.phraseLength);
        sysData.uFrame.savePhrase(rule.lower, phraseIndex, sysData.phraseLength);
      }
    }
  };
  // Validate the callback function's returned sysData values.
  // It's the user's responsibility to get it right but `UDT` fails if not.
  const validateUdtCallbackResult = function (udt, sysData, charsLeft) {
    if (sysData.phraseLength > charsLeft) {
      let str = `${thisFileName}opUDT(${udt.name}): callback function error: `;
      str += `sysData.phraseLength: ${sysData.phraseLength}`;
      str += ` must be <= remaining chars: ${charsLeft}`;
      throw new Error(str);
    }
    switch (sysData.state) {
      case id.ACTIVE:
        throw new Error(`${thisFileName}opUDT(${udt.name}): callback function return error. ACTIVE state not allowed.`);
      case id.EMPTY:
        if (udt.empty === false) {
          throw new Error(`${thisFileName}opUDT(${udt.name}): callback function return error. May not return EMPTY.`);
        } else {
          sysData.phraseLength = 0;
        }
        break;
      case id.MATCH:
        if (sysData.phraseLength === 0) {
          if (udt.empty === false) {
            throw new Error(`${thisFileName}opUDT(${udt.name}): callback function return error. May not return EMPTY.`);
          } else {
            sysData.state = id.EMPTY;
          }
        }
        break;
      case id.NOMATCH:
        sysData.phraseLength = 0;
        break;
      default:
        throw new Error(
          `${thisFileName}opUDT(${udt.name}): callback function return error. Unrecognized return state: ${sysData.state}`
        );
    }
  };
  // The `UDT` operator.<br>
  // Simply calls the user's callback function, but operates like `RNM` with regard to the `AST`
  // and back referencing.
  // There is some ambiguity here. `UDT`s act as terminals for phrase recognition but as named rules
  // for `AST` nodes and back referencing.
  // See [`ast.js`](./ast.html) for usage.
  const opUDT = function (opIndex, phraseIndex, sysData) {
    let astLength;
    let astIndex;
    let astDefined;
    let ulen;
    let plen;
    let saveFrame;
    const op = opcodes[opIndex];
    const udt = udts[op.index];
    sysData.UdtIndex = udt.index;

    const notLookAround = !inLookAround();
    /* ignore AST and back references in lookaround */
    if (notLookAround) {
      /* begin AST and back reference */
      astDefined = thisThis.ast && thisThis.ast.udtDefined(op.index);
      if (astDefined) {
        astIndex = rules.length + op.index;
        astLength = thisThis.ast.getLength();
        thisThis.ast.down(astIndex, udt.name);
      }
      /* NOTE: push and pop of the back reference frame is normally not necessary */
      /* only in the case that the UDT calls evaluateRule() or evaluateUdt() */
      ulen = sysData.uFrame.length();
      plen = sysData.pFrame.length();
      sysData.uFrame.push();
      sysData.pFrame.push();
      saveFrame = sysData.pFrame;
      sysData.pFrame = new backRef();
    }
    /* call the UDT */
    const charsLeft = charsEnd - phraseIndex;
    udtCallbacks[op.index](sysData, chars, phraseIndex, syntaxData);
    validateUdtCallbackResult(udt, sysData, charsLeft);
    if (notLookAround) {
      /* end AST */
      if (astDefined) {
        if (sysData.state === id.NOMATCH) {
          thisThis.ast.setLength(astLength);
        } else {
          thisThis.ast.up(astIndex, udt.name, phraseIndex, sysData.phraseLength);
        }
      }
      /* end back reference */
      sysData.pFrame = saveFrame;
      if (sysData.state === id.NOMATCH) {
        sysData.uFrame.pop(ulen);
        sysData.pFrame.pop(plen);
      } else if (udt.isBkr) {
        /* save phrase on both the parent and universal frames */
        /* BKR operator will decide which to use later */
        sysData.pFrame.savePhrase(udt.lower, phraseIndex, sysData.phraseLength);
        sysData.uFrame.savePhrase(udt.lower, phraseIndex, sysData.phraseLength);
      }
    }
  };
  // The `AND` operator.<br>
  // This is the positive `look ahead` operator.
  // Executes its single child node, returning the EMPTY state
  // if it succeedsand NOMATCH if it fails.
  // *Always* backtracks on any matched phrase and returns EMPTY on success.
  const opAND = function (opIndex, phraseIndex, sysData) {
    lookAround.push({
      lookAround: id.LOOKAROUND_AHEAD,
      anchor: phraseIndex,
      charsEnd,
      charsLength,
    });
    charsEnd = chars.length;
    charsLength = chars.length - charsBegin;
    opExecute(opIndex + 1, phraseIndex, sysData);
    const pop = lookAround.pop();
    charsEnd = pop.charsEnd;
    charsLength = pop.charsLength;
    sysData.phraseLength = 0;
    switch (sysData.state) {
      case id.EMPTY:
        sysData.state = id.EMPTY;
        break;
      case id.MATCH:
        sysData.state = id.EMPTY;
        break;
      case id.NOMATCH:
        sysData.state = id.NOMATCH;
        break;
      default:
        throw new Error(`opAND: invalid state ${sysData.state}`);
    }
  };
  // The `NOT` operator.<br>
  // This is the negative `look ahead` operator.
  // Executes its single child node, returning the EMPTY state
  // if it *fails* and NOMATCH if it succeeds.
  // *Always* backtracks on any matched phrase and returns EMPTY
  // on success (failure of its child node).
  const opNOT = function (opIndex, phraseIndex, sysData) {
    lookAround.push({
      lookAround: id.LOOKAROUND_AHEAD,
      anchor: phraseIndex,
      charsEnd,
      charsLength,
    });
    charsEnd = chars.length;
    charsLength = chars.length - charsBegin;
    opExecute(opIndex + 1, phraseIndex, sysData);
    const pop = lookAround.pop();
    charsEnd = pop.charsEnd;
    charsLength = pop.charsLength;
    sysData.phraseLength = 0;
    switch (sysData.state) {
      case id.EMPTY:
      case id.MATCH:
        sysData.state = id.NOMATCH;
        break;
      case id.NOMATCH:
        sysData.state = id.EMPTY;
        break;
      default:
        throw new Error(`opNOT: invalid state ${sysData.state}`);
    }
  };
  // The `TRG` operator.<br>
  // Succeeds if the single first character of the phrase is
  // within the `min - max` range.
  const opTRG = function (opIndex, phraseIndex, sysData) {
    const op = opcodes[opIndex];
    sysData.state = id.NOMATCH;
    if (phraseIndex < charsEnd) {
      if (op.min <= chars[phraseIndex] && chars[phraseIndex] <= op.max) {
        sysData.state = id.MATCH;
        sysData.phraseLength = 1;
      }
    }
  };
  // The `TBS` operator.<br>
  // Matches its pre-defined phrase against the input string.
  // All characters must match exactly.
  // Case-sensitive literal strings (`'string'` & `%s"string"`) are translated to `TBS`
  // operators by `apg`.
  // Phrase length of zero is not allowed.
  // Empty phrases can only be defined with `TLS` operators.
  const opTBS = function (opIndex, phraseIndex, sysData) {
    let i;
    const op = opcodes[opIndex];
    const len = op.string.length;
    sysData.state = id.NOMATCH;
    if (phraseIndex + len <= charsEnd) {
      for (i = 0; i < len; i += 1) {
        if (chars[phraseIndex + i] !== op.string[i]) {
          return;
        }
      }
      sysData.state = id.MATCH;
      sysData.phraseLength = len;
    } /* implied else NOMATCH */
  };
  // The `TLS` operator.<br>
  // Matches its pre-defined phrase against the input string.
  // A case-insensitive match is attempted for ASCII alphbetical characters.
  // `TLS` is the only operator that explicitly allows empty phrases.
  // `apg` will fail for empty `TBS`, case-sensitive strings (`''`) or
  // zero repetitions (`0*0RuleName` or `0RuleName`).
  const opTLS = function (opIndex, phraseIndex, sysData) {
    let i;
    let code;
    const op = opcodes[opIndex];
    sysData.state = id.NOMATCH;
    const len = op.string.length;
    if (len === 0) {
      /* EMPTY match allowed for TLS */
      sysData.state = id.EMPTY;
      return;
    }
    if (phraseIndex + len <= charsEnd) {
      for (i = 0; i < len; i += 1) {
        code = chars[phraseIndex + i];
        if (code >= 65 && code <= 90) {
          code += 32;
        }
        if (code !== op.string[i]) {
          return;
        }
      }
      sysData.state = id.MATCH;
      sysData.phraseLength = len;
    } /* implied else NOMATCH */
  };
  // The `ABG` operator.<br>
  // This is an "anchor" for the beginning of the string, similar to the familiar regex `^` anchor.
  // An anchor matches a position rather than a phrase.
  // Returns EMPTY if `phraseIndex` is 0, NOMATCH otherwise.
  const opABG = function (opIndex, phraseIndex, sysData) {
    sysData.state = id.NOMATCH;
    sysData.phraseLength = 0;
    sysData.state = phraseIndex === 0 ? id.EMPTY : id.NOMATCH;
  };
  // The `AEN` operator.<br>
  // This is an "anchor" for the end of the string, similar to the familiar regex `$` anchor.
  // An anchor matches a position rather than a phrase.
  // Returns EMPTY if `phraseIndex` equals the input string length, NOMATCH otherwise.
  const opAEN = function (opIndex, phraseIndex, sysData) {
    sysData.state = id.NOMATCH;
    sysData.phraseLength = 0;
    sysData.state = phraseIndex === chars.length ? id.EMPTY : id.NOMATCH;
  };
  // The `BKR` operator.<br>
  // The back reference operator.
  // Matches the last matched phrase of the named rule or UDT against the input string.
  // For ASCII alphbetical characters the match may be case sensitive (`%s`) or insensitive (`%i`),
  // depending on the back reference definition.
  // For `universal` mode (`%u`) matches the last phrase found anywhere in the grammar.
  // For `parent frame` mode (`%p`) matches the last phrase found in the parent rule only.
  const opBKR = function (opIndex, phraseIndex, sysData) {
    let i;
    let code;
    let lmcode;
    let lower;
    const op = opcodes[opIndex];
    sysData.state = id.NOMATCH;
    if (op.index < rules.length) {
      lower = rules[op.index].lower;
    } else {
      lower = udts[op.index - rules.length].lower;
    }
    const frame = op.bkrMode === id.BKR_MODE_PM ? sysData.pFrame.getPhrase(lower) : sysData.uFrame.getPhrase(lower);
    const insensitive = op.bkrCase === id.BKR_MODE_CI;
    if (frame === null) {
      return;
    }
    const lmIndex = frame.phraseIndex;
    const len = frame.phraseLength;
    if (len === 0) {
      sysData.state = id.EMPTY;
      return;
    }
    if (phraseIndex + len <= charsEnd) {
      if (insensitive) {
        /* case-insensitive match */
        for (i = 0; i < len; i += 1) {
          code = chars[phraseIndex + i];
          lmcode = chars[lmIndex + i];
          if (code >= 65 && code <= 90) {
            code += 32;
          }
          if (lmcode >= 65 && lmcode <= 90) {
            lmcode += 32;
          }
          if (code !== lmcode) {
            return;
          }
        }
        sysData.state = id.MATCH;
        sysData.phraseLength = len;
      } else {
        /* case-sensitive match */
        for (i = 0; i < len; i += 1) {
          code = chars[phraseIndex + i];
          lmcode = chars[lmIndex + i];
          if (code !== lmcode) {
            return;
          }
        }
      }
      sysData.state = id.MATCH;
      sysData.phraseLength = len;
    }
  };
  // The `BKA` operator.<br>
  // This is the positive `look behind` operator.
  // It's child node is parsed right-to-left.
  // Returns the EMPTY state if a match is found, NOMATCH otherwise.
  // Like the look ahead operators, it always backtracks to `phraseIndex`.
  const opBKA = function (opIndex, phraseIndex, sysData) {
    lookAround.push({
      lookAround: id.LOOKAROUND_BEHIND,
      anchor: phraseIndex,
    });
    opExecute(opIndex + 1, phraseIndex, sysData);
    lookAround.pop();
    sysData.phraseLength = 0;
    switch (sysData.state) {
      case id.EMPTY:
        sysData.state = id.EMPTY;
        break;
      case id.MATCH:
        sysData.state = id.EMPTY;
        break;
      case id.NOMATCH:
        sysData.state = id.NOMATCH;
        break;
      default:
        throw new Error(`opBKA: invalid state ${sysData.state}`);
    }
  };
  // The `BKN` operator.<br>
  // This is the negative `look behind` operator.
  // It's child node is parsed right-to-left.
  // Returns the EMPTY state if a match is *not* found, NOMATCH otherwise.
  // Like the look ahead operators, it always backtracks to `phraseIndex`.
  const opBKN = function (opIndex, phraseIndex, sysData) {
    // let op;
    // op = opcodes[opIndex];
    lookAround.push({
      lookAround: id.LOOKAROUND_BEHIND,
      anchor: phraseIndex,
    });
    opExecute(opIndex + 1, phraseIndex, sysData);
    lookAround.pop();
    sysData.phraseLength = 0;
    switch (sysData.state) {
      case id.EMPTY:
      case id.MATCH:
        sysData.state = id.NOMATCH;
        break;
      case id.NOMATCH:
        sysData.state = id.EMPTY;
        break;
      default:
        throw new Error(`opBKN: invalid state ${sysData.state}`);
    }
  };
  // The right-to-left `CAT` operator.<br>
  // Called for `CAT` operators when in look behind mode.
  // Calls its child nodes from right to left concatenating matched phrases right to left.
  const opCATBehind = function (opIndex, phraseIndex, sysData) {
    let success;
    let astLength;
    let catCharIndex;
    let catMatched;
    const op = opcodes[opIndex];
    const ulen = sysData.uFrame.length();
    const plen = sysData.pFrame.length();
    if (thisThis.ast) {
      astLength = thisThis.ast.getLength();
    }
    success = true;
    catCharIndex = phraseIndex;
    catMatched = 0;
    // catPhrase = 0;
    for (let i = op.children.length - 1; i >= 0; i -= 1) {
      opExecute(op.children[i], catCharIndex, sysData);
      catCharIndex -= sysData.phraseLength;
      catMatched += sysData.phraseLength;
      // catPhrase += sysData.phraseLength;
      if (sysData.state === id.NOMATCH) {
        success = false;
        break;
      }
    }
    if (success) {
      sysData.state = catMatched === 0 ? id.EMPTY : id.MATCH;
      sysData.phraseLength = catMatched;
    } else {
      sysData.state = id.NOMATCH;
      sysData.phraseLength = 0;
      sysData.uFrame.pop(ulen);
      sysData.pFrame.pop(plen);
      if (thisThis.ast) {
        thisThis.ast.setLength(astLength);
      }
    }
  };
  // The right-to-left `REP` operator.<br>
  // Called for `REP` operators in look behind mode.
  // Makes repeated calls to its child node, concatenating matched phrases right to left.
  const opREPBehind = function (opIndex, phraseIndex, sysData) {
    let astLength;
    let repCharIndex;
    let repPhrase;
    let repCount;
    const op = opcodes[opIndex];
    repCharIndex = phraseIndex;
    repPhrase = 0;
    repCount = 0;
    const ulen = sysData.uFrame.length();
    const plen = sysData.pFrame.length();
    if (thisThis.ast) {
      astLength = thisThis.ast.getLength();
    }
    const TRUE = true;
    while (TRUE) {
      if (repCharIndex <= 0) {
        /* exit on end of input string */
        break;
      }
      opExecute(opIndex + 1, repCharIndex, sysData);
      if (sysData.state === id.NOMATCH) {
        /* always end if the child node fails */
        break;
      }
      if (sysData.state === id.EMPTY) {
        /* REP always succeeds when the child node returns an empty phrase */
        /* this may not seem obvious, but that's the way it works out */
        break;
      }
      repCount += 1;
      repPhrase += sysData.phraseLength;
      repCharIndex -= sysData.phraseLength;
      if (repCount === op.max) {
        /* end on maxed out reps */
        break;
      }
    }
    /* evaluate the match count according to the min, max values */
    if (sysData.state === id.EMPTY) {
      sysData.state = repPhrase === 0 ? id.EMPTY : id.MATCH;
      sysData.phraseLength = repPhrase;
    } else if (repCount >= op.min) {
      sysData.state = repPhrase === 0 ? id.EMPTY : id.MATCH;
      sysData.phraseLength = repPhrase;
    } else {
      sysData.state = id.NOMATCH;
      sysData.phraseLength = 0;
      sysData.uFrame.pop(ulen);
      sysData.pFrame.pop(plen);
      if (thisThis.ast) {
        thisThis.ast.setLength(astLength);
      }
    }
  };
  // The right-to-left `TRG` operator.<br>
  // Called for `TRG` operators in look behind mode.
  // Matches a single character at `phraseIndex - 1` to the `min` - `max` range.
  const opTRGBehind = function (opIndex, phraseIndex, sysData) {
    const op = opcodes[opIndex];
    sysData.state = id.NOMATCH;
    sysData.phraseLength = 0;
    if (phraseIndex > 0) {
      const char = chars[phraseIndex - 1];
      if (op.min <= char && char <= op.max) {
        sysData.state = id.MATCH;
        sysData.phraseLength = 1;
      }
    }
  };
  // The right-to-left `TBS` operator.<br>
  // Called for `TBS` operators in look behind mode.
  // Matches the `TBS` phrase to the left of `phraseIndex`.
  const opTBSBehind = function (opIndex, phraseIndex, sysData) {
    let i;
    const op = opcodes[opIndex];
    sysData.state = id.NOMATCH;
    const len = op.string.length;
    const beg = phraseIndex - len;
    if (beg >= 0) {
      for (i = 0; i < len; i += 1) {
        if (chars[beg + i] !== op.string[i]) {
          return;
        }
      }
      sysData.state = id.MATCH;
      sysData.phraseLength = len;
    }
  };
  // The right-to-left `TLS` operator.<br>
  // Called for `TLS` operators in look behind mode.
  // Matches the `TLS` phrase to the left of `phraseIndex`.
  const opTLSBehind = function (opIndex, phraseIndex, sysData) {
    let char;
    const op = opcodes[opIndex];
    sysData.state = id.NOMATCH;
    const len = op.string.length;
    if (len === 0) {
      /* EMPTY match allowed for TLS */
      sysData.state = id.EMPTY;
      return;
    }
    const beg = phraseIndex - len;
    if (beg >= 0) {
      for (let i = 0; i < len; i += 1) {
        char = chars[beg + i];
        if (char >= 65 && char <= 90) {
          char += 32;
        }
        if (char !== op.string[i]) {
          return;
        }
      }
      sysData.state = id.MATCH;
      sysData.phraseLength = len;
    }
  };
  // The right-to-left back reference operator.<br>
  // Matches the back referenced phrase to the left of `phraseIndex`.
  const opBKRBehind = function (opIndex, phraseIndex, sysData) {
    let i;
    let code;
    let lmcode;
    let lower;
    const op = opcodes[opIndex];
    /* NOMATCH default */
    sysData.state = id.NOMATCH;
    sysData.phraseLength = 0;
    if (op.index < rules.length) {
      lower = rules[op.index].lower;
    } else {
      lower = udts[op.index - rules.length].lower;
    }
    const frame = op.bkrMode === id.BKR_MODE_PM ? sysData.pFrame.getPhrase(lower) : sysData.uFrame.getPhrase(lower);
    const insensitive = op.bkrCase === id.BKR_MODE_CI;
    if (frame === null) {
      return;
    }
    const lmIndex = frame.phraseIndex;
    const len = frame.phraseLength;
    if (len === 0) {
      sysData.state = id.EMPTY;
      sysData.phraseLength = 0;
      return;
    }
    const beg = phraseIndex - len;
    if (beg >= 0) {
      if (insensitive) {
        /* case-insensitive match */
        for (i = 0; i < len; i += 1) {
          code = chars[beg + i];
          lmcode = chars[lmIndex + i];
          if (code >= 65 && code <= 90) {
            code += 32;
          }
          if (lmcode >= 65 && lmcode <= 90) {
            lmcode += 32;
          }
          if (code !== lmcode) {
            return;
          }
        }
        sysData.state = id.MATCH;
        sysData.phraseLength = len;
      } else {
        /* case-sensitive match */
        for (i = 0; i < len; i += 1) {
          code = chars[beg + i];
          lmcode = chars[lmIndex + i];
          if (code !== lmcode) {
            return;
          }
        }
      }
      sysData.state = id.MATCH;
      sysData.phraseLength = len;
    }
  };
  // Generalized execution function.<br>
  // Having a single, generalized function, allows a single location
  // for tracing and statistics gathering functions to be called.
  // Tracing and statistics are handled in separate objects.
  // However, the parser calls their API to build the object data records.
  // See [`trace.js`](./trace.html) and [`stats.js`](./stats.html) for their
  // usage.
  opExecute = function opExecuteFunc(opIndex, phraseIndex, sysData) {
    let ret = true;
    const op = opcodes[opIndex];
    nodeHits += 1;
    if (nodeHits > limitNodeHits) {
      throw new Error(`parser: maximum number of node hits exceeded: ${limitNodeHits}`);
    }
    treeDepth += 1;
    if (treeDepth > maxTreeDepth) {
      maxTreeDepth = treeDepth;
      if (maxTreeDepth > limitTreeDepth) {
        throw new Error(`parser: maximum parse tree depth exceeded: ${limitTreeDepth}`);
      }
    }
    sysData.refresh();
    if (thisThis.trace !== null) {
      /* collect the trace record for down the parse tree */
      const lk = lookAroundValue();
      thisThis.trace.down(op, sysData.state, phraseIndex, sysData.phraseLength, lk.anchor, lk.lookAround);
    }
    if (inLookBehind()) {
      switch (op.type) {
        case id.ALT:
          opALT(opIndex, phraseIndex, sysData);
          break;
        case id.CAT:
          opCATBehind(opIndex, phraseIndex, sysData);
          break;
        case id.REP:
          opREPBehind(opIndex, phraseIndex, sysData);
          break;
        case id.RNM:
          opRNM(opIndex, phraseIndex, sysData);
          break;
        case id.UDT:
          opUDT(opIndex, phraseIndex, sysData);
          break;
        case id.AND:
          opAND(opIndex, phraseIndex, sysData);
          break;
        case id.NOT:
          opNOT(opIndex, phraseIndex, sysData);
          break;
        case id.TRG:
          opTRGBehind(opIndex, phraseIndex, sysData);
          break;
        case id.TBS:
          opTBSBehind(opIndex, phraseIndex, sysData);
          break;
        case id.TLS:
          opTLSBehind(opIndex, phraseIndex, sysData);
          break;
        case id.BKR:
          opBKRBehind(opIndex, phraseIndex, sysData);
          break;
        case id.BKA:
          opBKA(opIndex, phraseIndex, sysData);
          break;
        case id.BKN:
          opBKN(opIndex, phraseIndex, sysData);
          break;
        case id.ABG:
          opABG(opIndex, phraseIndex, sysData);
          break;
        case id.AEN:
          opAEN(opIndex, phraseIndex, sysData);
          break;
        default:
          ret = false;
          break;
      }
    } else {
      switch (op.type) {
        case id.ALT:
          opALT(opIndex, phraseIndex, sysData);
          break;
        case id.CAT:
          opCAT(opIndex, phraseIndex, sysData);
          break;
        case id.REP:
          opREP(opIndex, phraseIndex, sysData);
          break;
        case id.RNM:
          opRNM(opIndex, phraseIndex, sysData);
          break;
        case id.UDT:
          opUDT(opIndex, phraseIndex, sysData);
          break;
        case id.AND:
          opAND(opIndex, phraseIndex, sysData);
          break;
        case id.NOT:
          opNOT(opIndex, phraseIndex, sysData);
          break;
        case id.TRG:
          opTRG(opIndex, phraseIndex, sysData);
          break;
        case id.TBS:
          opTBS(opIndex, phraseIndex, sysData);
          break;
        case id.TLS:
          opTLS(opIndex, phraseIndex, sysData);
          break;
        case id.BKR:
          opBKR(opIndex, phraseIndex, sysData);
          break;
        case id.BKA:
          opBKA(opIndex, phraseIndex, sysData);
          break;
        case id.BKN:
          opBKN(opIndex, phraseIndex, sysData);
          break;
        case id.ABG:
          opABG(opIndex, phraseIndex, sysData);
          break;
        case id.AEN:
          opAEN(opIndex, phraseIndex, sysData);
          break;
        default:
          ret = false;
          break;
      }
    }
    if (!inLookAround() && phraseIndex + sysData.phraseLength > maxMatched) {
      maxMatched = phraseIndex + sysData.phraseLength;
    }
    if (thisThis.stats !== null) {
      /* collect the statistics */
      thisThis.stats.collect(op, sysData);
    }
    if (thisThis.trace !== null) {
      /* collect the trace record for up the parse tree */
      const lk = lookAroundValue();
      thisThis.trace.up(op, sysData.state, phraseIndex, sysData.phraseLength, lk.anchor, lk.lookAround);
    }
    treeDepth -= 1;
    return ret;
  };
};
