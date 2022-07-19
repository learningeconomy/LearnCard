/* eslint-disable class-methods-use-this */
/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// Attributes Validation
//
// It is well known that recursive-descent parsers will fail if a rule is left recursive.
// Besides left recursion, there are a couple of other fatal attributes that need to be disclosed as well.
// There are several non-fatal attributes that are of interest also.
// This module will determine six different attributes listed here with simple examples.
//
// **fatal attributes**<br>
// left recursion<br>
// S = S "x" / "y"
//
// cyclic<br>
// S = S
//
// infinite<br>
// S = "y" S
//
// **non-fatal attributes** (but nice to know)<br>
// nested recursion<br>
// S = "a" S "b" / "y"
//
// right recursion<br>
// S = "x" S / "y"
//
// empty string<br>
// S = "x" S / ""
//
// Note that these are “aggregate” attributes, in that if the attribute is true it only means that it can be true,
// not that it will always be true for every input string.
// In the simple examples above the attributes may be obvious and definite – always true or false.
// However, for a large grammar with possibly hundreds of rules and parse tree branches,
// it can be obscure which branches lead to which attributes.
// Furthermore, different input strings will lead the parser down different branches.
// One input string may parse perfectly while another will hit a left-recursive branch and bottom out the call stack.
//
// It is for this reason that the APG parser generator computes these attributes.
// When using the API the attributes call is optional but generating a parser without checking the attributes - proceed at your own peril.
//
// Additionally, the attribute phase will identify rule dependencies and mutually-recursive groups. For example,
//
// S = "a" A "b" / "y"<br>
// A = "x"
//
// S is dependent on A but A is not dependent on S.
//
// S = "a" A "b" / "c"<br>
// A = "x" S "y" / "z"
//
// S and A are dependent on one another and are mutually recursive.
module.exports = (function exportAttributes() {
  const id = require('../apg-lib/identifiers');
  const { ruleAttributes, showAttributes, showAttributeErrors } = require('./rule-attributes');
  const { ruleDependencies, showRuleDependencies } = require('./rule-dependencies');
  class State {
    constructor(rules, udts) {
      this.rules = rules;
      this.udts = udts;
      this.ruleCount = rules.length;
      this.udtCount = udts.length;
      this.startRule = 0;
      this.dependenciesComplete = false;
      this.attributesComplete = false;
      this.isMutuallyRecursive = false;
      this.ruleIndexes = this.indexArray(this.ruleCount);
      this.ruleAlphaIndexes = this.indexArray(this.ruleCount);
      this.ruleTypeIndexes = this.indexArray(this.ruleCount);
      this.udtIndexes = this.indexArray(this.udtCount);
      this.udtAlphaIndexes = this.indexArray(this.udtCount);
      this.attrsErrorCount = 0;
      this.attrs = [];
      this.attrsErrors = [];
      this.attrsWorking = [];
      this.ruleDeps = [];
      for (let i = 0; i < this.ruleCount; i += 1) {
        this.attrs.push(this.attrGen(this.rules[i]));
        this.attrsWorking.push(this.attrGen(this.rules[i]));
        this.ruleDeps.push(this.rdGen(rules[i], this.ruleCount, this.udtCount));
      }
      this.compRulesAlpha = this.compRulesAlpha.bind(this);
      this.compUdtsAlpha = this.compUdtsAlpha.bind(this);
      this.compRulesType = this.compRulesType.bind(this);
      this.compRulesGroup = this.compRulesGroup.bind(this);
    }

    // eslint-disable-next-line class-methods-use-this
    attrGen(rule) {
      return {
        left: false,
        nested: false,
        right: false,
        empty: false,
        finite: false,
        cyclic: false,
        leaf: false,
        isOpen: false,
        isComplete: false,
        rule,
      };
    }

    // eslint-disable-next-line class-methods-use-this
    attrInit(attr) {
      attr.left = false;
      attr.nested = false;
      attr.right = false;
      attr.empty = false;
      attr.finite = false;
      attr.cyclic = false;
      attr.leaf = false;
      attr.isOpen = false;
      attr.isComplete = false;
    }

    attrCopy(dst, src) {
      dst.left = src.left;
      dst.nested = src.nested;
      dst.right = src.right;
      dst.empty = src.empty;
      dst.finite = src.finite;
      dst.cyclic = src.cyclic;
      dst.leaf = src.leaf;
      dst.isOpen = src.isOpen;
      dst.isComplete = src.isComplete;
      dst.rule = src.rule;
    }

    rdGen(rule, ruleCount, udtCount) {
      const ret = {
        rule,
        recursiveType: id.ATTR_N,
        groupNumber: -1,
        refersTo: this.falseArray(ruleCount),
        refersToUdt: this.falseArray(udtCount),
        referencedBy: this.falseArray(ruleCount),
      };
      return ret;
    }

    typeToString(recursiveType) {
      switch (recursiveType) {
        case id.ATTR_N:
          return ' N';
        case id.ATTR_R:
          return ' R';
        case id.ATTR_MR:
          return 'MR';
        default:
          return 'UNKNOWN';
      }
    }

    falseArray(length) {
      const ret = [];
      if (length > 0) {
        for (let i = 0; i < length; i += 1) {
          ret.push(false);
        }
      }
      return ret;
    }

    falsifyArray(a) {
      for (let i = 0; i < a.length; i += 1) {
        a[i] = false;
      }
    }

    indexArray(length) {
      const ret = [];
      if (length > 0) {
        for (let i = 0; i < length; i += 1) {
          ret.push(i);
        }
      }
      return ret;
    }

    compRulesAlpha(left, right) {
      if (this.rules[left].lower < this.rules[right].lower) {
        return -1;
      }
      if (this.rules[left].lower > this.rules[right].lower) {
        return 1;
      }
      return 0;
    }

    compUdtsAlpha(left, right) {
      if (this.udts[left].lower < this.udts[right].lower) {
        return -1;
      }
      if (this.udts[left].lower > this.udts[right].lower) {
        return 1;
      }
      return 0;
    }

    compRulesType(left, right) {
      if (this.ruleDeps[left].recursiveType < this.ruleDeps[right].recursiveType) {
        return -1;
      }
      if (this.ruleDeps[left].recursiveType > this.ruleDeps[right].recursiveType) {
        return 1;
      }
      return 0;
    }

    compRulesGroup(left, right) {
      if (this.ruleDeps[left].recursiveType === id.ATTR_MR && this.ruleDeps[right].recursiveType === id.ATTR_MR) {
        if (this.ruleDeps[left].groupNumber < this.ruleDeps[right].groupNumber) {
          return -1;
        }
        if (this.ruleDeps[left].groupNumber > this.ruleDeps[right].groupNumber) {
          return 1;
        }
      }
      return 0;
    }
  }
  // eslint-disable-next-line no-unused-vars
  const attributes = function attributes(rules = [], udts = [], lineMap = [], errors = []) {
    // let i = 0;
    // Initialize the state. The state of the computation get passed around to multiple functions in multiple files.
    const state = new State(rules, udts);

    // Determine all rule dependencies
    //  - which rules each rule refers to
    //  - which rules reference each rule
    ruleDependencies(state);

    // Determine the attributes for each rule.
    ruleAttributes(state);
    if (state.attrsErrorCount) {
      errors.push({ line: 0, char: 0, msg: `${state.attrsErrorCount} attribute errors` });
    }

    // Return the number of attribute errors to the caller.
    return state.attrsErrorCount;
  };

  /* Destructuring assignment - see MDN Web Docs */
  return { attributes, showAttributes, showAttributeErrors, showRuleDependencies };
})();
