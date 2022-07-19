/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This module does the heavy lifting for attribute generation.
module.exports = (function exportRuleAttributes() {
  const id = require('../apg-lib/identifiers');
  const thisFile = 'rule-attributes.js';
  let state = null;
  function isEmptyOnly(attr) {
    if (attr.left || attr.nested || attr.right || attr.cyclic) {
      return false;
    }
    return attr.empty;
  }
  function isRecursive(attr) {
    if (attr.left || attr.nested || attr.right || attr.cyclic) {
      return true;
    }
    return false;
  }
  function isCatNested(attrs, count) {
    let i = 0;
    let j = 0;
    let k = 0;
    /* 1. if any child is nested, CAT is nested */
    for (i = 0; i < count; i += 1) {
      if (attrs[i].nested) {
        return true;
      }
    }
    /* 2.) the left-most right recursive child
               is followed by at least one non-empty child */
    for (i = 0; i < count; i += 1) {
      if (attrs[i].right && !attrs[i].leaf) {
        for (j = i + 1; j < count; j += 1) {
          if (!isEmptyOnly(attrs[j])) {
            return true;
          }
        }
      }
    }
    /* 3.) the right-most left recursive child
               is preceded by at least one non-empty child */
    for (i = count - 1; i >= 0; i -= 1) {
      if (attrs[i].left && !attrs[i].leaf) {
        for (j = i - 1; j >= 0; j -= 1) {
          if (!isEmptyOnly(attrs[j])) {
            return true;
          }
        }
      }
    }
    /* 4. there is at lease one recursive child between
              the left-most and right-most non-recursive, non-empty children */
    for (i = 0; i < count; i += 1) {
      if (!attrs[i].empty && !isRecursive(attrs[i])) {
        for (j = i + 1; j < count; j += 1) {
          if (isRecursive(attrs[j])) {
            for (k = j + 1; k < count; k += 1) {
              if (!attrs[k].empty && !isRecursive(attrs[k])) {
                return true;
              }
            }
          }
        }
      }
    }

    /* none of the above */
    return false;
  }
  function isCatCyclic(attrs, count) {
    /* if all children are cyclic, CAT is cyclic */
    for (let i = 0; i < count; i += 1) {
      if (!attrs[i].cyclic) {
        return false;
      }
    }
    return true;
  }
  function isCatLeft(attrs, count) {
    /* if the left-most non-empty is left, CAT is left */
    for (let i = 0; i < count; i += 1) {
      if (attrs[i].left) {
        return true;
      }
      if (!attrs[i].empty) {
        return false;
      }
      /* keep looking */
    }
    return false; /* all left-most are empty */
  }
  function isCatRight(attrs, count) {
    /* if the right-most non-empty is right, CAT is right */
    for (let i = count - 1; i >= 0; i -= 1) {
      if (attrs[i].right) {
        return true;
      }
      if (!attrs[i].empty) {
        return false;
      }
      /* keep looking */
    }
    return false;
  }
  function isCatEmpty(attrs, count) {
    /* if all children are empty, CAT is empty */
    for (let i = 0; i < count; i += 1) {
      if (!attrs[i].empty) {
        return false;
      }
    }
    return true;
  }
  function isCatFinite(attrs, count) {
    /* if all children are finite, CAT is finite */
    for (let i = 0; i < count; i += 1) {
      if (!attrs[i].finite) {
        return false;
      }
    }
    return true;
  }
  function cat(stateArg, opcodes, opIndex, iAttr) {
    let i = 0;
    const opCat = opcodes[opIndex];
    const count = opCat.children.length;

    /* generate an empty array of child attributes */
    const childAttrs = [];
    for (i = 0; i < count; i += 1) {
      childAttrs.push(stateArg.attrGen());
    }
    for (i = 0; i < count; i += 1) {
      // eslint-disable-next-line no-use-before-define
      opEval(stateArg, opcodes, opCat.children[i], childAttrs[i]);
    }
    iAttr.left = isCatLeft(childAttrs, count);
    iAttr.right = isCatRight(childAttrs, count);
    iAttr.nested = isCatNested(childAttrs, count);
    iAttr.empty = isCatEmpty(childAttrs, count);
    iAttr.finite = isCatFinite(childAttrs, count);
    iAttr.cyclic = isCatCyclic(childAttrs, count);
  }
  function alt(stateArg, opcodes, opIndex, iAttr) {
    let i = 0;
    const opAlt = opcodes[opIndex];
    const count = opAlt.children.length;

    /* generate an empty array of child attributes */
    const childAttrs = [];
    for (i = 0; i < count; i += 1) {
      childAttrs.push(stateArg.attrGen());
    }
    for (i = 0; i < count; i += 1) {
      // eslint-disable-next-line no-use-before-define
      opEval(stateArg, opcodes, opAlt.children[i], childAttrs[i]);
    }

    /* if any child attribute is true, ALT is true */
    iAttr.left = false;
    iAttr.right = false;
    iAttr.nested = false;
    iAttr.empty = false;
    iAttr.finite = false;
    iAttr.cyclic = false;
    for (i = 0; i < count; i += 1) {
      if (childAttrs[i].left) {
        iAttr.left = true;
      }
      if (childAttrs[i].nested) {
        iAttr.nested = true;
      }
      if (childAttrs[i].right) {
        iAttr.right = true;
      }
      if (childAttrs[i].empty) {
        iAttr.empty = true;
      }
      if (childAttrs[i].finite) {
        iAttr.finite = true;
      }
      if (childAttrs[i].cyclic) {
        iAttr.cyclic = true;
      }
    }
  }
  function bkr(stateArg, opcodes, opIndex, iAttr) {
    const opBkr = opcodes[opIndex];
    if (opBkr.index >= stateArg.ruleCount) {
      /* use UDT values */
      iAttr.empty = stateArg.udts[opBkr.index - stateArg.ruleCount].empty;
      iAttr.finite = true;
    } else {
      /* use the empty and finite values from the back referenced rule */
      // eslint-disable-next-line no-use-before-define
      ruleAttrsEval(stateArg, opBkr.index, iAttr);

      /* however, this is a terminal node like TLS */
      iAttr.left = false;
      iAttr.nested = false;
      iAttr.right = false;
      iAttr.cyclic = false;
    }
  }

  function opEval(stateArg, opcodes, opIndex, iAttr) {
    stateArg.attrInit(iAttr);
    const opi = opcodes[opIndex];
    switch (opi.type) {
      case id.ALT:
        alt(stateArg, opcodes, opIndex, iAttr);
        break;
      case id.CAT:
        cat(stateArg, opcodes, opIndex, iAttr);
        break;
      case id.REP:
        opEval(stateArg, opcodes, opIndex + 1, iAttr);
        if (opi.min === 0) {
          iAttr.empty = true;
          iAttr.finite = true;
        }
        break;
      case id.RNM:
        // eslint-disable-next-line no-use-before-define
        ruleAttrsEval(stateArg, opcodes[opIndex].index, iAttr);
        break;
      case id.BKR:
        bkr(stateArg, opcodes, opIndex, iAttr);
        break;
      case id.AND:
      case id.NOT:
      case id.BKA:
      case id.BKN:
        opEval(stateArg, opcodes, opIndex + 1, iAttr);
        iAttr.empty = true;
        break;
      case id.TLS:
        iAttr.empty = !opcodes[opIndex].string.length;
        iAttr.finite = true;
        iAttr.cyclic = false;
        break;
      case id.TBS:
      case id.TRG:
        iAttr.empty = false;
        iAttr.finite = true;
        iAttr.cyclic = false;
        break;
      case id.UDT:
        iAttr.empty = opi.empty;
        iAttr.finite = true;
        iAttr.cyclic = false;
        break;
      case id.ABG:
      case id.AEN:
        iAttr.empty = true;
        iAttr.finite = true;
        iAttr.cyclic = false;
        break;
      default:
        throw new Error(`unknown opcode type: ${opi}`);
    }
  }
  // The main logic for handling rules that:
  //  - have already be evaluated
  //  - have not been evaluated and is the first occurrence on this branch
  //  - second occurrence on this branch for the start rule
  //  - second occurrence on this branch for non-start rules
  function ruleAttrsEval(stateArg, ruleIndex, iAttr) {
    const attri = stateArg.attrsWorking[ruleIndex];
    if (attri.isComplete) {
      /* just use the completed values */
      stateArg.attrCopy(iAttr, attri);
    } else if (!attri.isOpen) {
      /* open the rule and traverse it */
      attri.isOpen = true;
      opEval(stateArg, attri.rule.opcodes, 0, iAttr);
      /* complete this rule's attributes */
      attri.left = iAttr.left;
      attri.right = iAttr.right;
      attri.nested = iAttr.nested;
      attri.empty = iAttr.empty;
      attri.finite = iAttr.finite;
      attri.cyclic = iAttr.cyclic;
      attri.leaf = false;
      attri.isOpen = false;
      attri.isComplete = true;
    } else if (ruleIndex === stateArg.startRule) {
      /* use recursive leaf values */
      if (ruleIndex === stateArg.startRule) {
        iAttr.left = true;
        iAttr.right = true;
        iAttr.cyclic = true;
        iAttr.leaf = true;
      }
    } else {
      /* non-start rule terminal leaf */
      iAttr.finite = true;
    }
  }
  // The main driver for the attribute generation.
  const ruleAttributes = (stateArg) => {
    state = stateArg;
    let i = 0;
    let j = 0;
    const iAttr = state.attrGen();
    for (i = 0; i < state.ruleCount; i += 1) {
      /* initialize working attributes */
      for (j = 0; j < state.ruleCount; j += 1) {
        state.attrInit(state.attrsWorking[j]);
      }
      state.startRule = i;
      ruleAttrsEval(state, i, iAttr);

      /* save off the working attributes for this rule */
      state.attrCopy(state.attrs[i], state.attrsWorking[i]);
    }
    state.attributesComplete = true;
    let attri = null;
    for (i = 0; i < state.ruleCount; i += 1) {
      attri = state.attrs[i];
      if (attri.left || !attri.finite || attri.cyclic) {
        const temp = state.attrGen(attri.rule);
        state.attrCopy(temp, attri);
        state.attrsErrors.push(temp);
        state.attrsErrorCount += 1;
      }
    }
  };
  const truth = (val) => (val ? 't' : 'f');
  const tError = (val) => (val ? 'e' : 'f');
  const fError = (val) => (val ? 't' : 'e');
  const showAttr = (seq, index, attr, dep) => {
    let str = `${seq}:${index}:`;
    str += `${tError(attr.left)} `;
    str += `${truth(attr.nested)} `;
    str += `${truth(attr.right)} `;
    str += `${tError(attr.cyclic)} `;
    str += `${fError(attr.finite)} `;
    str += `${truth(attr.empty)}:`;
    str += `${state.typeToString(dep.recursiveType)}:`;
    str += dep.recursiveType === id.ATTR_MR ? dep.groupNumber : '-';
    str += `:${attr.rule.name}\n`;
    return str;
  };

  const showLegend = () => {
    let str = 'LEGEND - t=true, f=false, e=error\n';
    str += 'sequence:rule index:left nested right cyclic finite empty:type:group number:rule name\n';
    return str;
  };
  const showAttributeErrors = () => {
    let attri = null;
    let depi = null;
    let str = '';
    str += 'RULE ATTRIBUTES WITH ERRORS\n';
    str += showLegend();
    if (state.attrsErrorCount) {
      for (let i = 0; i < state.attrsErrorCount; i += 1) {
        attri = state.attrsErrors[i];
        depi = state.ruleDeps[attri.rule.index];
        str += showAttr(i, attri.rule.index, attri, depi);
      }
    } else {
      str += '<none>\n';
    }
    return str;
  };

  const show = (type) => {
    let i = 0;
    let ii = 0;
    let attri = null;
    let depi = null;
    let str = '';
    let { ruleIndexes } = state;
    // let udtIndexes = state.udtIndexes;
    if (type === 97) {
      ruleIndexes = state.ruleAlphaIndexes;
      // udtIndexes = state.udtAlphaIndexes;
    } else if (type === 116) {
      ruleIndexes = state.ruleTypeIndexes;
      // udtIndexes = state.udtAlphaIndexes;
    }
    /* show all attributes */
    for (i = 0; i < state.ruleCount; i += 1) {
      ii = ruleIndexes[i];
      attri = state.attrs[ii];
      depi = state.ruleDeps[ii];
      str += showAttr(i, ii, attri, depi);
    }
    return str;
  };

  // Display the rule attributes.
  // - order
  //      - "index" or "i", index order (default)
  //      - "alpha" or "a", alphabetical order
  //      - "type" or "t", ordered by type (alphabetical within each type/group)
  //      - none of above, index order (default)
  const showAttributes = (order = 'index') => {
    if (!state.attributesComplete) {
      throw new Error(`${thisFile}:showAttributes: attributes not available`);
    }
    let str = '';
    const leader = 'RULE ATTRIBUTES\n';
    if (order.charCodeAt(0) === 97) {
      str += 'alphabetical by rule name\n';
      str += leader;
      str += showLegend();
      str += show(97);
    } else if (order.charCodeAt(0) === 116) {
      str += 'ordered by rule type\n';
      str += leader;
      str += showLegend();
      str += show(116);
    } else {
      str += 'ordered by rule index\n';
      str += leader;
      str += showLegend();
      str += show();
    }
    return str;
  };

  /* Destructuring assignment - see MDN Web Docs */
  return { ruleAttributes, showAttributes, showAttributeErrors };
})();
