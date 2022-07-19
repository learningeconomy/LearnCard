/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// Determine rule dependencies and types.
// For each rule, determine which other rules it refers to
// and which of the other rules refer back to it.
//
// Rule types are:
//  - non-recursive - the rule never refers to itself, even indirectly
//  - recursive - the rule refers to itself, possibly indirectly
//  - mutually-recursive - belongs to a group of two or more rules, each of which refers to every other rule in the group, including itself.
module.exports = (() => {
  const id = require('../apg-lib/identifiers');
  let state = null; /* keep a global reference to the state for the show functions */

  /* scan the opcodes of the indexed rule and discover which rules it references and which rule refer back to it */
  const scan = (ruleCount, ruleDeps, index, isScanned) => {
    let i = 0;
    let j = 0;
    const rdi = ruleDeps[index];
    isScanned[index] = true;
    const op = rdi.rule.opcodes;
    for (i = 0; i < op.length; i += 1) {
      const opi = op[i];
      if (opi.type === id.RNM) {
        rdi.refersTo[opi.index] = true;
        if (!isScanned[opi.index]) {
          scan(ruleCount, ruleDeps, opi.index, isScanned);
        }
        for (j = 0; j < ruleCount; j += 1) {
          if (ruleDeps[opi.index].refersTo[j]) {
            rdi.refersTo[j] = true;
          }
        }
      } else if (opi.type === id.UDT) {
        rdi.refersToUdt[opi.index] = true;
      } else if (opi.type === id.BKR) {
        if (opi.index < ruleCount) {
          rdi.refersTo[opi.index] = true;
          if (!isScanned[opi.index]) {
            scan(ruleCount, ruleDeps, opi.index, isScanned);
          }
        } else {
          rdi.refersToUdt[ruleCount - opi.index] = true;
        }
      }
    }
  };
  // Determine the rule dependencies, types and mutually recursive groups.
  const ruleDependencies = (stateArg) => {
    state = stateArg; /* make it global */
    let i = 0;
    let j = 0;
    let groupCount = 0;
    let rdi = null;
    let rdj = null;
    let newGroup = false;
    state.dependenciesComplete = false;

    /* make a working array of rule scanned markers */
    const isScanned = state.falseArray(state.ruleCount);

    /* discover the rule dependencies */
    for (i = 0; i < state.ruleCount; i += 1) {
      state.falsifyArray(isScanned);
      scan(state.ruleCount, state.ruleDeps, i, isScanned);
    }
    /* discover all rules referencing each rule */
    for (i = 0; i < state.ruleCount; i += 1) {
      for (j = 0; j < state.ruleCount; j += 1) {
        if (i !== j) {
          if (state.ruleDeps[j].refersTo[i]) {
            state.ruleDeps[i].referencedBy[j] = true;
          }
        }
      }
    }
    /* find the non-recursive and recursive types */
    for (i = 0; i < state.ruleCount; i += 1) {
      state.ruleDeps[i].recursiveType = id.ATTR_N;
      if (state.ruleDeps[i].refersTo[i]) {
        state.ruleDeps[i].recursiveType = id.ATTR_R;
      }
    }

    /* find the mutually-recursive groups, if any */
    groupCount = -1;
    for (i = 0; i < state.ruleCount; i += 1) {
      rdi = state.ruleDeps[i];
      if (rdi.recursiveType === id.ATTR_R) {
        newGroup = true;
        for (j = 0; j < state.ruleCount; j += 1) {
          if (i !== j) {
            rdj = state.ruleDeps[j];
            if (rdj.recursiveType === id.ATTR_R) {
              if (rdi.refersTo[j] && rdj.refersTo[i]) {
                if (newGroup) {
                  groupCount += 1;
                  rdi.recursiveType = id.ATTR_MR;
                  rdi.groupNumber = groupCount;
                  newGroup = false;
                }
                rdj.recursiveType = id.ATTR_MR;
                rdj.groupNumber = groupCount;
              }
            }
          }
        }
      }
    }
    state.isMutuallyRecursive = groupCount > -1;

    /* sort the rules/UDTS */
    state.ruleAlphaIndexes.sort(state.compRulesAlpha);
    state.ruleTypeIndexes.sort(state.compRulesAlpha);
    state.ruleTypeIndexes.sort(state.compRulesType);
    if (state.isMutuallyRecursive) {
      state.ruleTypeIndexes.sort(state.compRulesGroup);
    }
    if (state.udtCount) {
      state.udtAlphaIndexes.sort(state.compUdtsAlpha);
    }

    state.dependenciesComplete = true;
  };
  const show = (type = null) => {
    let i = 0;
    let j = 0;
    let count = 0;
    let startSeg = 0;
    const maxRule = state.ruleCount - 1;
    const maxUdt = state.udtCount - 1;
    const lineLength = 100;
    let str = '';
    let pre = '';
    const toArrow = '=> ';
    const byArrow = '<= ';
    let first = false;
    let rdi = null;
    let { ruleIndexes } = state;
    let { udtIndexes } = state;
    if (type === 97) {
      ruleIndexes = state.ruleAlphaIndexes;
      udtIndexes = state.udtAlphaIndexes;
    } else if (type === 116) {
      ruleIndexes = state.ruleTypeIndexes;
      udtIndexes = state.udtAlphaIndexes;
    }
    for (i = 0; i < state.ruleCount; i += 1) {
      rdi = state.ruleDeps[ruleIndexes[i]];
      pre = `${ruleIndexes[i]}:${state.typeToString(rdi.recursiveType)}:`;
      if (state.isMutuallyRecursive) {
        pre += rdi.groupNumber > -1 ? rdi.groupNumber : '-';
        pre += ':';
      }
      pre += ' ';
      str += `${pre + state.rules[ruleIndexes[i]].name}\n`;
      first = true;
      count = 0;
      startSeg = str.length;
      str += pre;
      for (j = 0; j < state.ruleCount; j += 1) {
        if (rdi.refersTo[ruleIndexes[j]]) {
          if (first) {
            str += toArrow;
            first = false;
            str += state.ruleDeps[ruleIndexes[j]].rule.name;
          } else {
            str += `, ${state.ruleDeps[ruleIndexes[j]].rule.name}`;
          }
          count += 1;
        }
        if (str.length - startSeg > lineLength && j !== maxRule) {
          str += `\n${pre}${toArrow}`;
          startSeg = str.length;
        }
      }
      if (state.udtCount) {
        for (j = 0; j < state.udtCount; j += 1) {
          if (rdi.refersToUdt[udtIndexes[j]]) {
            if (first) {
              str += toArrow;
              first = false;
              str += state.udts[udtIndexes[j]].name;
            } else {
              str += `, ${state.udts[udtIndexes[j]].name}`;
            }
            count += 1;
          }
          if (str.length - startSeg > lineLength && j !== maxUdt) {
            str += `\n${pre}${toArrow}`;
            startSeg = str.length;
          }
        }
      }
      if (count === 0) {
        str += '=> <none>\n';
      }
      if (first === false) {
        str += '\n';
      }
      first = true;
      count = 0;
      startSeg = str.length;
      str += pre;
      for (j = 0; j < state.ruleCount; j += 1) {
        if (rdi.referencedBy[ruleIndexes[j]]) {
          if (first) {
            str += byArrow;
            first = false;
            str += state.ruleDeps[ruleIndexes[j]].rule.name;
          } else {
            str += `, ${state.ruleDeps[ruleIndexes[j]].rule.name}`;
          }
          count += 1;
        }
        if (str.length - startSeg > lineLength && j !== maxRule) {
          str += `\n${pre}${toArrow}`;
          startSeg = str.length;
        }
      }
      if (count === 0) {
        str += '<= <none>\n';
      }
      if (first === false) {
        str += '\n';
      }
      str += '\n';
    }
    return str;
  };
  // Display the rule dependencies.
  // - order
  //      - "index" or "i", index order (default)
  //      - "alpha" or "a", alphabetical order
  //      - "type" or "t", ordered by type (alphabetical within each type/group)
  //      - none of above, index order (default)
  const showRuleDependencies = (order = 'index') => {
    let str = 'RULE DEPENDENCIES(index:type:[group number:])\n';
    str += '=> refers to rule names\n';
    str += '<= referenced by rule names\n';
    if (!state.dependenciesComplete) {
      return str;
    }

    if (order.charCodeAt(0) === 97) {
      str += 'alphabetical by rule name\n';
      str += show(97);
    } else if (order.charCodeAt(0) === 116) {
      str += 'ordered by rule type\n';
      str += show(116);
    } else {
      str += 'ordered by rule index\n';
      str += show(null);
    }
    return str;
  };

  /* Destructuring assignment - see MDN Web Docs */
  return { ruleDependencies, showRuleDependencies };
})();
