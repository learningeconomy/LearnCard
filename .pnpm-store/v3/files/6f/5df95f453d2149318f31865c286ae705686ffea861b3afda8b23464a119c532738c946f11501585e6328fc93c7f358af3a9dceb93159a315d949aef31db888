/* eslint-disable func-names */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This module provides a means of tracing the parser through the parse tree as it goes.
// It is the primary debugging facility for debugging both the SABNF grammar syntax
// and the input strings that are supposed to be valid grammar sentences.
// It is also a very informative and educational tool for understanding
// how a parser actually operates for a given language.
//
// Tracing is the process of generating and saving a record of information for each passage
// of the parser through a parse tree node. And since it traverses each node twice, once down the tree
// and once coming back up, there are two records for each node.
// This, obviously, has the potential of generating lots of records.
// And since these records are normally displayed on a web page
// it is important to have a means to limit the actual number of records generated to
// probably no more that a few thousand. This is almost always enough to find any errors.
// The problem is to get the *right* few thousand records.
// Therefore, this module has a number of ways of limiting and/or filtering, the number and type of records.
// Considerable effort has been made to make this filtering of the trace output as simple
// and intuitive as possible.
//
// However, the ability to filter the trace records, or for that matter even understand what they are
// and the information they contain, does require a minimum amount of understanding of the APG parsing
// method. The parse tree nodes are all represented by APG operators. They break down into two natural groups.
// - The `RNM` operators and `UDT` operators are named phrases.
// These are names chosen by the writer of the SABNF grammar to represent special phrases of interest.
// - All others collect, concatenate and otherwise manipulate various intermediate phrases along the way.
//
// There are separate means of filtering which of these operators in each of these two groups get traced.
// Let `trace` be an instantiated `trace.js` object.
// Prior to parsing the string, filtering the rules and UDTs can be defined as follows:
// ```
// trace.filter.rules["rulename"] = true;
//     /* trace rule name "rulename" */
// trace.filter.rules["udtname"]  = true;
//     /* trace UDT name "udtname" */
// trace.filter.rules["<ALL>"]    = true;
//     /* trace all rules and UDTs (the default) */
// trace.filter.rules["<NONE>"]   = true;
//     /* trace no rules or UDTS */
// ```
// If any rule or UDT name other than "&lt;ALL>" or "&lt;NONE>" is specified, all other names are turned off.
// Therefore, to be selective of rule names, a filter statement is required for each rule/UDT name desired.
//
// Filtering of the other operators follows a similar procedure.
// ```
// trace.filter.operators["TRG"] = true;
//     /* trace the terminal range, TRG, operators */
// trace.filter.operators["CAT"]  = true;
//     /* trace the concatenations, CAT, operators */
// trace.filter.operators["<ALL>"]    = true;
//     /* trace all operators */
// trace.filter.operators["<NONE>"]   = true;
//     /* trace no operators (the default) */
// ```
// If any operator name other than "&lt;ALL>" or "&lt;NONE>" is specified, all other names are turned off.
// Therefore, to be selective of operator names, a filter statement is required for each name desired.
//
// There is, additionally, a means for limiting the total number of filtered or saved trace records.
// See the function, `setMaxRecords(max)` below. This will result in only the last `max` records being saved.
//
// (See [`apg-examples`](https://github.com/ldthomas/apg-js-examples) for examples of using `trace.js`.)
module.exports = function exportTrace() {
  const utils = require('./utilities');
  const style = require('./style');
  const circular = new (require('./circular-buffer'))();
  const id = require('./identifiers');

  const thisFileName = 'trace.js: ';
  const that = this;
  const MODE_HEX = 16;
  const MODE_DEC = 10;
  const MODE_ASCII = 8;
  const MODE_UNICODE = 32;
  const MAX_PHRASE = 80;
  const MAX_TLS = 5;
  const records = [];
  let maxRecords = 5000;
  let lastRecord = -1;
  let filteredRecords = 0;
  let treeDepth = 0;
  const recordStack = [];
  let chars = null;
  let rules = null;
  let udts = null;
  const operatorFilter = [];
  const ruleFilter = [];
  /* special trace table phrases */
  const PHRASE_END = `<span class="${style.CLASS_LINEEND}">&bull;</span>`;
  const PHRASE_CONTINUE = `<span class="${style.CLASS_LINEEND}">&hellip;</span>`;
  const PHRASE_EMPTY = `<span class="${style.CLASS_EMPTY}">&#120634;</span>`;
  /* filter the non-RNM & non-UDT operators */
  const initOperatorFilter = function () {
    const setOperators = function (set) {
      operatorFilter[id.ALT] = set;
      operatorFilter[id.CAT] = set;
      operatorFilter[id.REP] = set;
      operatorFilter[id.TLS] = set;
      operatorFilter[id.TBS] = set;
      operatorFilter[id.TRG] = set;
      operatorFilter[id.AND] = set;
      operatorFilter[id.NOT] = set;
      operatorFilter[id.BKR] = set;
      operatorFilter[id.BKA] = set;
      operatorFilter[id.BKN] = set;
      operatorFilter[id.ABG] = set;
      operatorFilter[id.AEN] = set;
    };
    let items = 0;
    // eslint-disable-next-line no-unused-vars
    for (const name in that.filter.operators) {
      items += 1;
    }
    if (items === 0) {
      /* case 1: no operators specified: default: do not trace any operators */
      setOperators(false);
      return;
    }
    for (const name in that.filter.operators) {
      const upper = name.toUpperCase();
      if (upper === '<ALL>') {
        /* case 2: <all> operators specified: trace all operators ignore all other operator commands */
        setOperators(true);
        return;
      }
      if (upper === '<NONE>') {
        /* case 3: <none> operators specified: trace NO operators ignore all other operator commands */
        setOperators(false);
        return;
      }
    }
    setOperators(false);
    for (const name in that.filter.operators) {
      const upper = name.toUpperCase();
      /* case 4: one or more individual operators specified: trace 'true' operators only */
      if (upper === 'ALT') {
        operatorFilter[id.ALT] = that.filter.operators[name] === true;
      } else if (upper === 'CAT') {
        operatorFilter[id.CAT] = that.filter.operators[name] === true;
      } else if (upper === 'REP') {
        operatorFilter[id.REP] = that.filter.operators[name] === true;
      } else if (upper === 'AND') {
        operatorFilter[id.AND] = that.filter.operators[name] === true;
      } else if (upper === 'NOT') {
        operatorFilter[id.NOT] = that.filter.operators[name] === true;
      } else if (upper === 'TLS') {
        operatorFilter[id.TLS] = that.filter.operators[name] === true;
      } else if (upper === 'TBS') {
        operatorFilter[id.TBS] = that.filter.operators[name] === true;
      } else if (upper === 'TRG') {
        operatorFilter[id.TRG] = that.filter.operators[name] === true;
      } else if (upper === 'BKR') {
        operatorFilter[id.BKR] = that.filter.operators[name] === true;
      } else if (upper === 'BKA') {
        operatorFilter[id.BKA] = that.filter.operators[name] === true;
      } else if (upper === 'BKN') {
        operatorFilter[id.BKN] = that.filter.operators[name] === true;
      } else if (upper === 'ABG') {
        operatorFilter[id.ABG] = that.filter.operators[name] === true;
      } else if (upper === 'AEN') {
        operatorFilter[id.AEN] = that.filter.operators[name] === true;
      } else {
        throw new Error(
          `${thisFileName}initOpratorFilter: '${name}' not a valid operator name.` +
            ` Must be <all>, <none>, alt, cat, rep, tls, tbs, trg, and, not, bkr, bka or bkn`
        );
      }
    }
  };
  /* filter the rule and `UDT` named operators */
  const initRuleFilter = function () {
    const setRules = function (set) {
      operatorFilter[id.RNM] = set;
      operatorFilter[id.UDT] = set;
      const count = rules.length + udts.length;
      ruleFilter.length = 0;
      for (let i = 0; i < count; i += 1) {
        ruleFilter.push(set);
      }
    };
    let items;
    let i;
    const list = [];
    for (i = 0; i < rules.length; i += 1) {
      list.push(rules[i].lower);
    }
    for (i = 0; i < udts.length; i += 1) {
      list.push(udts[i].lower);
    }
    ruleFilter.length = 0;
    items = 0;
    // eslint-disable-next-line no-unused-vars
    for (const name in that.filter.rules) {
      items += 1;
    }
    if (items === 0) {
      /* case 1: default to all rules & udts */
      setRules(true);
      return;
    }
    for (const name in that.filter.rules) {
      const lower = name.toLowerCase();
      if (lower === '<all>') {
        /* case 2: trace all rules ignore all other rule commands */
        setRules(true);
        return;
      }
      if (lower === '<none>') {
        /* case 3: trace no rules */
        setRules(false);
        return;
      }
    }
    /* case 4: trace only individually specified rules */
    setRules(false);
    operatorFilter[id.RNM] = true;
    operatorFilter[id.UDT] = true;
    for (const name in that.filter.rules) {
      const lower = name.toLowerCase();
      i = list.indexOf(lower);
      if (i < 0) {
        throw new Error(`${thisFileName}initRuleFilter: '${name}' not a valid rule or udt name`);
      }
      ruleFilter[i] = that.filter.rules[name] === true;
    }
  };
  /* used by other APG components to verify that they have a valid trace object */
  this.traceObject = 'traceObject';
  this.filter = {
    operators: [],
    rules: [],
  };
  // Set the maximum number of records to keep (default = 5000).
  // Each record number larger than `maxRecords`
  // will result in deleting the previously oldest record.
  // - `max`: maximum number of records to retain (default = 5000)
  // - `last`: last record number to retain, (default = -1 for (unknown) actual last record)
  this.setMaxRecords = function (max, last) {
    lastRecord = -1;
    if (typeof max === 'number' && max > 0) {
      maxRecords = Math.ceil(max);
    } else {
      maxRecords = 0;
      return;
    }
    if (typeof last === 'number') {
      lastRecord = Math.floor(last);
      if (lastRecord < 0) {
        lastRecord = -1;
      }
    }
  };
  // Returns `maxRecords` to the caller.
  this.getMaxRecords = function () {
    return maxRecords;
  };
  // Returns `lastRecord` to the caller.
  this.getLastRecord = function () {
    return lastRecord;
  };
  /* Called only by the `parser.js` object. No verification of input. */
  this.init = function (rulesIn, udtsIn, charsIn) {
    records.length = 0;
    recordStack.length = 0;
    filteredRecords = 0;
    treeDepth = 0;
    chars = charsIn;
    rules = rulesIn;
    udts = udtsIn;
    initOperatorFilter();
    initRuleFilter();
    circular.init(maxRecords);
  };
  /* returns true if this records passes through the designated filter, false if the record is to be skipped */
  const filterOps = function (op) {
    let ret = false;
    if (op.type === id.RNM) {
      if (operatorFilter[op.type] && ruleFilter[op.index]) {
        ret = true;
      } else {
        ret = false;
      }
    } else if (op.type === id.UDT) {
      if (operatorFilter[op.type] && ruleFilter[rules.length + op.index]) {
        ret = true;
      } else {
        ret = false;
      }
    } else {
      ret = operatorFilter[op.type];
    }
    return ret;
  };
  const filterRecords = function (record) {
    if (lastRecord === -1) {
      return true;
    }
    if (record <= lastRecord) {
      return true;
    }
    return false;
  };
  /* Collect the "down" record. */
  this.down = function (op, state, offset, length, anchor, lookAround) {
    if (filterRecords(filteredRecords) && filterOps(op)) {
      recordStack.push(filteredRecords);
      records[circular.increment()] = {
        dirUp: false,
        depth: treeDepth,
        thisLine: filteredRecords,
        thatLine: undefined,
        opcode: op,
        state,
        phraseIndex: offset,
        phraseLength: length,
        lookAnchor: anchor,
        lookAround,
      };
      filteredRecords += 1;
      treeDepth += 1;
    }
  };
  /* Collect the "up" record. */
  this.up = function (op, state, offset, length, anchor, lookAround) {
    if (filterRecords(filteredRecords) && filterOps(op)) {
      const thisLine = filteredRecords;
      const thatLine = recordStack.pop();
      const thatRecord = circular.getListIndex(thatLine);
      if (thatRecord !== -1) {
        records[thatRecord].thatLine = thisLine;
      }
      treeDepth -= 1;
      records[circular.increment()] = {
        dirUp: true,
        depth: treeDepth,
        thisLine,
        thatLine,
        opcode: op,
        state,
        phraseIndex: offset,
        phraseLength: length,
        lookAnchor: anchor,
        lookAround,
      };
      filteredRecords += 1;
    }
  };
  /* convert the trace records to a tree of nodes */
  const toTreeObj = function () {
    /* private helper functions */
    function nodeOpcode(node, opcode) {
      let name;
      let casetype;
      let modetype;
      if (opcode) {
        node.op = { id: opcode.type, name: utils.opcodeToString(opcode.type) };
        node.opData = undefined;
        switch (opcode.type) {
          case id.RNM:
            node.opData = rules[opcode.index].name;
            break;
          case id.UDT:
            node.opData = udts[opcode.index].name;
            break;
          case id.BKR:
            if (opcode.index < rules.length) {
              name = rules[opcode.index].name;
            } else {
              name = udts[opcode.index - rules.length].name;
            }
            casetype = opcode.bkrCase === id.BKR_MODE_CI ? '%i' : '%s';
            modetype = opcode.bkrMode === id.BKR_MODE_UM ? '%u' : '%p';
            node.opData = `\\\\${casetype}${modetype}${name}`;
            break;
          case id.TLS:
            node.opData = [];
            for (let i = 0; i < opcode.string.length; i += 1) {
              node.opData.push(opcode.string[i]);
            }
            break;
          case id.TBS:
            node.opData = [];
            for (let i = 0; i < opcode.string.length; i += 1) {
              node.opData.push(opcode.string[i]);
            }
            break;
          case id.TRG:
            node.opData = [opcode.min, opcode.max];
            break;
          case id.REP:
            node.opData = [opcode.min, opcode.max];
            break;
          default:
            throw new Error('unrecognized opcode');
        }
      } else {
        node.op = { id: undefined, name: undefined };
        node.opData = undefined;
      }
    }
    function nodePhrase(state, index, length) {
      if (state === id.MATCH) {
        return {
          index,
          length,
        };
      }
      if (state === id.NOMATCH) {
        return {
          index,
          length: 0,
        };
      }
      if (state === id.EMPTY) {
        return {
          index,
          length: 0,
        };
      }
      return null;
    }
    let nodeId = -1;
    function nodeDown(parent, record, depth) {
      const node = {
        // eslint-disable-next-line no-plusplus
        id: nodeId++,
        branch: -1,
        parent,
        up: false,
        down: false,
        depth,
        children: [],
      };
      if (record) {
        node.down = true;
        node.state = { id: record.state, name: utils.stateToString(record.state) };
        node.phrase = null;
        nodeOpcode(node, record.opcode);
      } else {
        node.state = { id: undefined, name: undefined };
        node.phrase = nodePhrase();
        nodeOpcode(node, undefined);
      }
      return node;
    }
    function nodeUp(node, record) {
      if (record) {
        node.up = true;
        node.state = { id: record.state, name: utils.stateToString(record.state) };
        node.phrase = nodePhrase(record.state, record.phraseIndex, record.phraseLength);
        if (!node.down) {
          nodeOpcode(node, record.opcode);
        }
      }
    }
    /* walk the final tree: label branches and count leaf nodes */
    let leafNodes = 0;
    let depth = -1;
    let branchCount = 1;
    function walk(node) {
      depth += 1;
      node.branch = branchCount;
      if (depth > treeDepth) {
        treeDepth = depth;
      }
      if (node.children.length === 0) {
        leafNodes += 1;
      } else {
        for (let i = 0; i < node.children.length; i += 1) {
          if (i > 0) {
            branchCount += 1;
          }
          node.children[i].leftMost = false;
          node.children[i].rightMost = false;
          if (node.leftMost) {
            node.children[i].leftMost = i === 0;
          }
          if (node.rightMost) {
            node.children[i].rightMost = i === node.children.length - 1;
          }
          walk(node.children[i]);
        }
      }
      depth -= 1;
    }
    function display(node, offset) {
      let name;
      const obj = {};
      obj.id = node.id;
      obj.branch = node.branch;
      obj.leftMost = node.leftMost;
      obj.rightMost = node.rightMost;
      name = node.state.name ? node.state.name : 'ACTIVE';
      obj.state = { id: node.state.id, name };
      name = node.op.name ? node.op.name : '?';
      obj.op = { id: node.op.id, name };
      if (typeof node.opData === 'string') {
        obj.opData = node.opData;
      } else if (Array.isArray(node.opData)) {
        obj.opData = [];
        for (let i = 0; i < node.opData.length; i += 1) {
          obj.opData[i] = node.opData[i];
        }
      } else {
        obj.opData = undefined;
      }
      if (node.phrase) {
        obj.phrase = { index: node.phrase.index, length: node.phrase.length };
      } else {
        obj.phrase = null;
      }
      obj.depth = node.depth;
      obj.children = [];
      for (let i = 0; i < node.children.length; i += 1) {
        const c = i !== node.children.length - 1;
        obj.children[i] = display(node.children[i], offset, c);
      }
      return obj;
    }

    /* construct the tree beginning here */
    const branch = [];
    let root;
    let node;
    let parent;
    let record;
    let firstRecord = true;
    /* push a dummy node so the root node will have a non-null parent */
    const dummy = nodeDown(null, null, -1);
    branch.push(dummy);
    node = dummy;
    circular.forEach((lineIndex) => {
      record = records[lineIndex];
      if (firstRecord) {
        firstRecord = false;
        if (record.depth > 0) {
          /* push some dummy nodes to fill in for missing records */
          const num = record.dirUp ? record.depth + 1 : record.depth;
          for (let i = 0; i < num; i += 1) {
            parent = node;
            node = nodeDown(node, null, i);
            branch.push(node);
            parent.children.push(node);
          }
        }
      }
      if (record.dirUp) {
        /* handle the next record up */
        node = branch.pop();
        nodeUp(node, record);
        node = branch[branch.length - 1];
      } else {
        /* handle the next record down */
        parent = node;
        node = nodeDown(node, record, record.depth);
        branch.push(node);
        parent.children.push(node);
      }
    });

    /* if not at root, walk it up to root */
    while (branch.length > 1) {
      node = branch.pop();
      nodeUp(node, null);
    }
    /* maybe redundant or paranoid tests: these should never happen */
    if (dummy.children.length === 0) {
      throw new Error('trace.toTree(): parse tree has no nodes');
    }
    if (branch.length === 0) {
      throw new Error('trace.toTree(): integrity check: dummy root node disappeared?');
    }

    /* if no record for start rule: find the pseudo root node (first dummy node above a real node) */
    root = dummy.children[0];
    let prev = root;
    while (root && !root.down && !root.up) {
      prev = root;
      root = root.children[0];
    }
    root = prev;

    /* walk the tree of nodes: label brances and count leaves */
    root.leftMost = true;
    root.rightMost = true;
    walk(root);
    root.branch = 0;

    /* generate the exported object */
    const obj = {};
    obj.string = [];
    for (let i = 0; i < chars.length; i += 1) {
      obj.string[i] = chars[i];
    }
    /* generate the exported rule names */
    obj.rules = [];
    for (let i = 0; i < rules.length; i += 1) {
      obj.rules[i] = rules[i].name;
    }
    /* generate the exported UDT names */
    obj.udts = [];
    for (let i = 0; i < udts.length; i += 1) {
      obj.udts[i] = udts[i].name;
    }
    /* generate the ids */
    obj.id = {};
    obj.id.ALT = { id: id.ALT, name: 'ALT' };
    obj.id.CAT = { id: id.CAT, name: 'CAT' };
    obj.id.REP = { id: id.REP, name: 'REP' };
    obj.id.RNM = { id: id.RNM, name: 'RNM' };
    obj.id.TLS = { id: id.TLS, name: 'TLS' };
    obj.id.TBS = { id: id.TBS, name: 'TBS' };
    obj.id.TRG = { id: id.TRG, name: 'TRG' };
    obj.id.UDT = { id: id.UDT, name: 'UDT' };
    obj.id.AND = { id: id.AND, name: 'AND' };
    obj.id.NOT = { id: id.NOT, name: 'NOT' };
    obj.id.BKR = { id: id.BKR, name: 'BKR' };
    obj.id.BKA = { id: id.BKA, name: 'BKA' };
    obj.id.BKN = { id: id.BKN, name: 'BKN' };
    obj.id.ABG = { id: id.ABG, name: 'ABG' };
    obj.id.AEN = { id: id.AEN, name: 'AEN' };
    obj.id.ACTIVE = { id: id.ACTIVE, name: 'ACTIVE' };
    obj.id.MATCH = { id: id.MATCH, name: 'MATCH' };
    obj.id.EMPTY = { id: id.EMPTY, name: 'EMPTY' };
    obj.id.NOMATCH = { id: id.NOMATCH, name: 'NOMATCH' };
    /* generate the max tree depth */
    obj.treeDepth = treeDepth;
    /* generate the number of leaf nodes (branches) */
    obj.leafNodes = leafNodes;
    /* generate the types of the left- and right-most branches */
    let branchesIncomplete;
    if (root.down) {
      if (root.up) {
        branchesIncomplete = 'none';
      } else {
        branchesIncomplete = 'right';
      }
    } else if (root.up) {
      branchesIncomplete = 'left';
    } else {
      branchesIncomplete = 'both';
    }
    obj.branchesIncomplete = branchesIncomplete;
    obj.tree = display(root, root.depth, false);
    return obj;
  };
  // Returns the trace records as JSON parse tree object.
  // - stringify: if `true`, the object is 'stringified' before returning, otherwise, the object itself is returned.
  this.toTree = function (stringify) {
    const obj = toTreeObj();
    if (stringify) {
      return JSON.stringify(obj);
    }
    return obj;
  };
  // Translate the trace records to HTML format and create a complete HTML page for browser display.
  this.toHtmlPage = function (mode, caption, title) {
    return utils.htmlToPage(this.toHtml(mode, caption), title);
  };

  /* From here on down, these are just helper functions for `toHtml()`. */
  const htmlHeader = function (mode, caption) {
    /* open the page */
    /* write the HTML5 header with table style */
    /* open the <table> tag */
    let modeName;
    switch (mode) {
      case MODE_HEX:
        modeName = 'hexadecimal';
        break;
      case MODE_DEC:
        modeName = 'decimal';
        break;
      case MODE_ASCII:
        modeName = 'ASCII';
        break;
      case MODE_UNICODE:
        modeName = 'UNICODE';
        break;
      default:
        throw new Error(`${thisFileName}htmlHeader: unrecognized mode: ${mode}`);
    }
    let header = '';
    header += `<p>display mode: ${modeName}</p>\n`;
    header += `<table class="${style.CLASS_TRACE}">\n`;
    if (typeof caption === 'string') {
      header += `<caption>${caption}</caption>`;
    }
    return header;
  };
  const htmlFooter = function () {
    let footer = '';
    /* close the </table> tag */
    footer += '</table>\n';
    /* display a table legend */
    footer += `<p class="${style.CLASS_MONOSPACE}">legend:<br>\n`;
    footer += '(a)&nbsp;-&nbsp;line number<br>\n';
    footer += '(b)&nbsp;-&nbsp;matching line number<br>\n';
    footer += '(c)&nbsp;-&nbsp;phrase offset<br>\n';
    footer += '(d)&nbsp;-&nbsp;phrase length<br>\n';
    footer += '(e)&nbsp;-&nbsp;tree depth<br>\n';
    footer += '(f)&nbsp;-&nbsp;operator state<br>\n';
    footer += `&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;<span class="${style.CLASS_ACTIVE}">&darr;</span>&nbsp;&nbsp;phrase opened<br>\n`;
    footer += `&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;<span class="${style.CLASS_MATCH}">&uarr;M</span> phrase matched<br>\n`;
    footer += `&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;<span class="${style.CLASS_EMPTY}">&uarr;E</span> empty phrase matched<br>\n`;
    footer += `&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;<span class="${style.CLASS_NOMATCH}">&uarr;N</span> phrase not matched<br>\n`;
    footer +=
      'operator&nbsp;-&nbsp;ALT, CAT, REP, RNM, TRG, TLS, TBS<sup>&dagger;</sup>, UDT, AND, NOT, BKA, BKN, BKR, ABG, AEN<sup>&Dagger;</sup><br>\n';
    footer += `phrase&nbsp;&nbsp;&nbsp;-&nbsp;up to ${MAX_PHRASE} characters of the phrase being matched<br>\n`;
    footer += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;<span class="${style.CLASS_MATCH}">matched characters</span><br>\n`;
    footer += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;<span class="${style.CLASS_LOOKAHEAD}">matched characters in look ahead mode</span><br>\n`;
    footer += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;<span class="${style.CLASS_LOOKBEHIND}">matched characters in look behind mode</span><br>\n`;
    footer += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;<span class="${style.CLASS_REMAINDER}">remainder characters(not yet examined by parser)</span><br>\n`;
    footer += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;<span class="${style.CLASS_CTRLCHAR}">control characters, TAB, LF, CR, etc. (ASCII mode only)</span><br>\n`;
    footer += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;${PHRASE_EMPTY} empty string<br>\n`;
    footer += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;${PHRASE_END} end of input string<br>\n`;
    footer += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;${PHRASE_CONTINUE} input string display truncated<br>\n`;
    footer += '</p>\n';
    footer += `<p class="${style.CLASS_MONOSPACE}">\n`;
    footer += '<sup>&dagger;</sup>original ABNF operators:<br>\n';
    footer += 'ALT - alternation<br>\n';
    footer += 'CAT - concatenation<br>\n';
    footer += 'REP - repetition<br>\n';
    footer += 'RNM - rule name<br>\n';
    footer += 'TRG - terminal range<br>\n';
    footer += 'TLS - terminal literal string (case insensitive)<br>\n';
    footer += 'TBS - terminal binary string (case sensitive)<br>\n';
    footer += '<br>\n';
    footer += '<sup>&Dagger;</sup>super set SABNF operators:<br>\n';
    footer += 'UDT - user-defined terminal<br>\n';
    footer += 'AND - positive look ahead<br>\n';
    footer += 'NOT - negative look ahead<br>\n';
    footer += 'BKA - positive look behind<br>\n';
    footer += 'BKN - negative look behind<br>\n';
    footer += 'BKR - back reference<br>\n';
    footer += 'ABG - anchor - begin of input string<br>\n';
    footer += 'AEN - anchor - end of input string<br>\n';
    footer += '</p>\n';
    return footer;
  };
  this.indent = function (depth) {
    let html = '';
    for (let i = 0; i < depth; i += 1) {
      html += '.';
    }
    return html;
  };
  /* format the TRG operator */
  const displayTrg = function (mode, op) {
    let html = '';
    if (op.type === id.TRG) {
      if (mode === MODE_HEX || mode === MODE_UNICODE) {
        let hex = op.min.toString(16).toUpperCase();
        if (hex.length % 2 !== 0) {
          hex = `0${hex}`;
        }
        html += mode === MODE_HEX ? '%x' : 'U+';
        html += hex;
        hex = op.max.toString(16).toUpperCase();
        if (hex.length % 2 !== 0) {
          hex = `0${hex}`;
        }
        html += `&ndash;${hex}`;
      } else {
        html = `%d${op.min.toString(10)}&ndash;${op.max.toString(10)}`;
      }
    }
    return html;
  };
  /* format the REP operator */
  const displayRep = function (mode, op) {
    let html = '';
    if (op.type === id.REP) {
      if (mode === MODE_HEX) {
        let hex = op.min.toString(16).toUpperCase();
        if (hex.length % 2 !== 0) {
          hex = `0${hex}`;
        }
        html = `x${hex}`;
        if (op.max < Infinity) {
          hex = op.max.toString(16).toUpperCase();
          if (hex.length % 2 !== 0) {
            hex = `0${hex}`;
          }
        } else {
          hex = 'inf';
        }
        html += `&ndash;${hex}`;
      } else if (op.max < Infinity) {
        html = `${op.min.toString(10)}&ndash;${op.max.toString(10)}`;
      } else {
        html = `${op.min.toString(10)}&ndash;inf`;
      }
    }
    return html;
  };
  /* format the TBS operator */
  const displayTbs = function (mode, op) {
    let html = '';
    if (op.type === id.TBS) {
      const len = Math.min(op.string.length, MAX_TLS * 2);
      if (mode === MODE_HEX || mode === MODE_UNICODE) {
        html += mode === MODE_HEX ? '%x' : 'U+';
        for (let i = 0; i < len; i += 1) {
          let hex;
          if (i > 0) {
            html += '.';
          }
          hex = op.string[i].toString(16).toUpperCase();
          if (hex.length % 2 !== 0) {
            hex = `0${hex}`;
          }
          html += hex;
        }
      } else {
        html = '%d';
        for (let i = 0; i < len; i += 1) {
          if (i > 0) {
            html += '.';
          }
          html += op.string[i].toString(10);
        }
      }
      if (len < op.string.length) {
        html += PHRASE_CONTINUE;
      }
    }
    return html;
  };
  /* format the TLS operator */
  const displayTls = function (mode, op) {
    let html = '';
    if (op.type === id.TLS) {
      const len = Math.min(op.string.length, MAX_TLS);
      if (mode === MODE_HEX || mode === MODE_DEC) {
        let charu;
        let charl;
        let base;
        if (mode === MODE_HEX) {
          html = '%x';
          base = 16;
        } else {
          html = '%d';
          base = 10;
        }
        for (let i = 0; i < len; i += 1) {
          if (i > 0) {
            html += '.';
          }
          charl = op.string[i];
          if (charl >= 97 && charl <= 122) {
            charu = charl - 32;
            html += `${charu.toString(base)}/${charl.toString(base)}`.toUpperCase();
          } else if (charl >= 65 && charl <= 90) {
            charu = charl;
            charl += 32;
            html += `${charu.toString(base)}/${charl.toString(base)}`.toUpperCase();
          } else {
            html += charl.toString(base).toUpperCase();
          }
        }
        if (len < op.string.length) {
          html += PHRASE_CONTINUE;
        }
      } else {
        html = '"';
        for (let i = 0; i < len; i += 1) {
          html += utils.asciiChars[op.string[i]];
        }
        if (len < op.string.length) {
          html += PHRASE_CONTINUE;
        }
        html += '"';
      }
    }
    return html;
  };
  const subPhrase = function (mode, charsArg, index, length, prev) {
    if (length === 0) {
      return '';
    }
    let phrase = '';
    const comma = prev ? ',' : '';
    switch (mode) {
      case MODE_HEX:
        phrase = comma + utils.charsToHex(charsArg, index, length);
        break;
      case MODE_DEC:
        if (prev) {
          return `,${utils.charsToDec(charsArg, index, length)}`;
        }
        phrase = comma + utils.charsToDec(charsArg, index, length);
        break;
      case MODE_UNICODE:
        phrase = utils.charsToUnicode(charsArg, index, length);
        break;
      case MODE_ASCII:
      default:
        phrase = utils.charsToAsciiHtml(charsArg, index, length);
        break;
    }
    return phrase;
  };
  /* display phrases matched in look-behind mode */
  const displayBehind = function (mode, charsArg, state, index, length, anchor) {
    let html = '';
    let beg1;
    let len1;
    let beg2;
    let len2;
    let lastchar = PHRASE_END;
    const spanBehind = `<span class="${style.CLASS_LOOKBEHIND}">`;
    const spanRemainder = `<span class="${style.CLASS_REMAINDER}">`;
    const spanend = '</span>';
    let prev = false;
    switch (state) {
      case id.EMPTY:
        html += PHRASE_EMPTY;
      /* // eslint-disable-next-line no-fallthrough */
      case id.NOMATCH:
      case id.MATCH:
      case id.ACTIVE:
        beg1 = index - length;
        len1 = anchor - beg1;
        beg2 = anchor;
        len2 = charsArg.length - beg2;
        break;
      default:
        throw new Error('unrecognized state');
    }
    lastchar = PHRASE_END;
    if (len1 > MAX_PHRASE) {
      len1 = MAX_PHRASE;
      lastchar = PHRASE_CONTINUE;
      len2 = 0;
    } else if (len1 + len2 > MAX_PHRASE) {
      lastchar = PHRASE_CONTINUE;
      len2 = MAX_PHRASE - len1;
    }
    if (len1 > 0) {
      html += spanBehind;
      html += subPhrase(mode, charsArg, beg1, len1, prev);
      html += spanend;
      prev = true;
    }
    if (len2 > 0) {
      html += spanRemainder;
      html += subPhrase(mode, charsArg, beg2, len2, prev);
      html += spanend;
    }
    return html + lastchar;
  };
  const displayForward = function (mode, charsArg, state, index, length, spanAhead) {
    let html = '';
    let beg1;
    let len1;
    let beg2;
    let len2;
    let lastchar = PHRASE_END;
    const spanRemainder = `<span class="${style.CLASS_REMAINDER}">`;
    const spanend = '</span>';
    let prev = false;
    switch (state) {
      case id.EMPTY:
        html += PHRASE_EMPTY;
      /* // eslint-disable-next-line no-fallthrough */
      case id.NOMATCH:
      case id.ACTIVE:
        beg1 = index;
        len1 = 0;
        beg2 = index;
        len2 = charsArg.length - beg2;
        break;
      case id.MATCH:
        beg1 = index;
        len1 = length;
        beg2 = index + len1;
        len2 = charsArg.length - beg2;
        break;
      default:
        throw new Error('unrecognized state');
    }
    lastchar = PHRASE_END;
    if (len1 > MAX_PHRASE) {
      len1 = MAX_PHRASE;
      lastchar = PHRASE_CONTINUE;
      len2 = 0;
    } else if (len1 + len2 > MAX_PHRASE) {
      lastchar = PHRASE_CONTINUE;
      len2 = MAX_PHRASE - len1;
    }
    if (len1 > 0) {
      html += spanAhead;
      html += subPhrase(mode, charsArg, beg1, len1, prev);
      html += spanend;
      prev = true;
    }
    if (len2 > 0) {
      html += spanRemainder;
      html += subPhrase(mode, charsArg, beg2, len2, prev);
      html += spanend;
    }
    return html + lastchar;
  };
  /* display phrases matched in look-ahead mode */
  const displayAhead = function (mode, charsArg, state, index, length) {
    const spanAhead = `<span class="${style.CLASS_LOOKAHEAD}">`;
    return displayForward(mode, charsArg, state, index, length, spanAhead);
  };
  /* display phrases matched in normal parsing mode */
  const displayNone = function (mode, charsArg, state, index, length) {
    const spanAhead = `<span class="${style.CLASS_MATCH}">`;
    return displayForward(mode, charsArg, state, index, length, spanAhead);
  };
  /* Returns the filtered records, formatted as an HTML table. */
  const htmlTable = function (mode) {
    if (rules === null) {
      return '';
    }
    let html = '';
    let thisLine;
    let thatLine;
    let lookAhead;
    let lookBehind;
    let lookAround;
    let anchor;
    html += '<tr><th>(a)</th><th>(b)</th><th>(c)</th><th>(d)</th><th>(e)</th><th>(f)</th>';
    html += '<th>operator</th><th>phrase</th></tr>\n';
    circular.forEach((lineIndex) => {
      const line = records[lineIndex];
      thisLine = line.thisLine;
      thatLine = line.thatLine !== undefined ? line.thatLine : '--';
      lookAhead = false;
      lookBehind = false;
      lookAround = false;
      if (line.lookAround === id.LOOKAROUND_AHEAD) {
        lookAhead = true;
        lookAround = true;
        anchor = line.lookAnchor;
      }
      if (line.opcode.type === id.AND || line.opcode.type === id.NOT) {
        lookAhead = true;
        lookAround = true;
        anchor = line.phraseIndex;
      }
      if (line.lookAround === id.LOOKAROUND_BEHIND) {
        lookBehind = true;
        lookAround = true;
        anchor = line.lookAnchor;
      }
      if (line.opcode.type === id.BKA || line.opcode.type === id.BKN) {
        lookBehind = true;
        lookAround = true;
        anchor = line.phraseIndex;
      }
      html += '<tr>';
      html += `<td>${thisLine}</td><td>${thatLine}</td>`;
      html += `<td>${line.phraseIndex}</td>`;
      html += `<td>${line.phraseLength}</td>`;
      html += `<td>${line.depth}</td>`;
      html += '<td>';
      switch (line.state) {
        case id.ACTIVE:
          html += `<span class="${style.CLASS_ACTIVE}">&darr;&nbsp;</span>`;
          break;
        case id.MATCH:
          html += `<span class="${style.CLASS_MATCH}">&uarr;M</span>`;
          break;
        case id.NOMATCH:
          html += `<span class="${style.CLASS_NOMATCH}">&uarr;N</span>`;
          break;
        case id.EMPTY:
          html += `<span class="${style.CLASS_EMPTY}">&uarr;E</span>`;
          break;
        default:
          html += `<span class="${style.CLASS_ACTIVE}">--</span>`;
          break;
      }
      html += '</td>';
      html += '<td>';
      html += that.indent(line.depth);
      if (lookAhead) {
        html += `<span class="${style.CLASS_LOOKAHEAD}">`;
      } else if (lookBehind) {
        html += `<span class="${style.CLASS_LOOKBEHIND}">`;
      }
      html += utils.opcodeToString(line.opcode.type);
      if (line.opcode.type === id.RNM) {
        html += `(${rules[line.opcode.index].name}) `;
      }
      if (line.opcode.type === id.BKR) {
        const casetype = line.opcode.bkrCase === id.BKR_MODE_CI ? '%i' : '%s';
        const modetype = line.opcode.bkrMode === id.BKR_MODE_UM ? '%u' : '%p';
        html += `(\\${casetype}${modetype}${rules[line.opcode.index].name}) `;
      }
      if (line.opcode.type === id.UDT) {
        html += `(${udts[line.opcode.index].name}) `;
      }
      if (line.opcode.type === id.TRG) {
        html += `(${displayTrg(mode, line.opcode)}) `;
      }
      if (line.opcode.type === id.TBS) {
        html += `(${displayTbs(mode, line.opcode)}) `;
      }
      if (line.opcode.type === id.TLS) {
        html += `(${displayTls(mode, line.opcode)}) `;
      }
      if (line.opcode.type === id.REP) {
        html += `(${displayRep(mode, line.opcode)}) `;
      }
      if (lookAround) {
        html += '</span>';
      }
      html += '</td>';
      html += '<td>';
      if (lookBehind) {
        html += displayBehind(mode, chars, line.state, line.phraseIndex, line.phraseLength, anchor);
      } else if (lookAhead) {
        html += displayAhead(mode, chars, line.state, line.phraseIndex, line.phraseLength);
      } else {
        html += displayNone(mode, chars, line.state, line.phraseIndex, line.phraseLength);
      }
      html += '</td></tr>\n';
    });
    html += '<tr><th>(a)</th><th>(b)</th><th>(c)</th><th>(d)</th><th>(e)</th><th>(f)</th>';
    html += '<th>operator</th><th>phrase</th></tr>\n';
    html += '</table>\n';
    return html;
  };
  // Translate the trace records to HTML format.
  // - *modearg* - can be `"ascii"`, `"decimal"`, `"hexadecimal"` or `"unicode"`.
  // Determines the format of the string character code display.
  // - *caption* - optional caption for the HTML table.
  this.toHtml = function (modearg, caption) {
    /* writes the trace records as a table in a complete html page */
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
    let html = '';
    html += htmlHeader(mode, caption);
    html += htmlTable(mode);
    html += htmlFooter();
    return html;
  };
};
