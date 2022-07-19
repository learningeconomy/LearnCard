/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This is the main or driver function for the parser generator.
// It handles:
//    - verification and interpretation of the command line parameters
//    - execution of immediate commands (help, version)
//    - reading and verifying the input SABNF grammar file(s)
//    - parsing the input SABNF grammar and reporting errors, if any
//    - evaluation of the input grammar's attributes
//    - if all is OK, generating the source code for a grammar object
//    - writing the source to a specified file
//
// Note on teminology.
//
// APG is a parser generator.
// However, it really only generates a "grammar object" (see below) from the defining SABNF grammar.
// The generated parser is incomplete at this stage.
// Remaining, it is the job of the user to develop the generated parser from the grammar object and the APG Library (**apg-lib**).
//
// The following terminology my help clear up the confusion between the idea of a "generated parser" versus a "generated grammar object".
// - The generating parser: APG is an APG parser (yes, there is a circular dependence between **apg** and **apg-lib**). We'll call it the generating parser.
// - The target parser: APG's goal is to generate a parser. We'll call it the target parser.
// - The target grammar: this is the (ASCII) SABNF grammar defining the target parser.
// - The target grammar object: APG parses the SABNF grammar and generates the JavaScript source for a target grammar object.
// - The final target parser: The user then develops the final target parser using the generated target grammar
// object and the APG parsing library, **apg-lib**.
module.exports = function apg(args) {
  const fs = require('fs');
  const ApiCtor = require('../apg-api/api');
  const getConfig = require('./command-line');
  const thisFileName = 'apg.js: ';
  const util = require('util');
  function logErrors(api, header) {
    console.log('\nORIGINAL GRAMMAR:');
    console.log(api.linesToAscii());
    console.log(`\n${header}:`);
    console.log(api.errorsToAscii());
  }
  try {
    /* Get command line parameters and set up the configuration accordingly. */
    const config = getConfig(args);
    if (config.error) {
      console.log(config.error);
      console.log(config.help);
      return;
    }
    if (config.help) {
      console.log(config.help);
      return;
    }
    if (config.version) {
      console.log(config.version);
      return;
    }

    /* Get and validate the input SABNF grammar. */
    const api = new ApiCtor(config.src);

    api.scan(config.strict);
    if (api.errors.length) {
      logErrors(api, 'GRAMMAR CHARACTER ERRORS');
      throw new Error(`${thisFileName}invalid input grammar`);
    }

    /* parse the grammar - the syntax phase */
    api.parse(config.strict);
    if (api.errors.length) {
      logErrors(api, 'GRAMMAR SYNTAX ERRORS');
      throw new Error(`${thisFileName}grammar has syntax errors`);
    }

    /* translate the AST - the semantic phase */
    api.translate();
    if (api.errors.length) {
      logErrors(api, 'GRAMMAR SEMANTIC ERRORS');
      throw new Error(`${thisFileName}grammar has semantic errors`);
    }

    if (config.displayRules) {
      console.log(api.displayRules('alpha'));
      console.log();
    }

    /* attribute generation */
    const errorCount = api.attributes();
    if (errorCount > 0) {
      console.log('GRAMMAR ATTRIBUTE ERRORS');
      console.log(api.displayAttributeErrors());
      console.log();
      if (config.displayAttributes) {
        console.log(api.displayAttributes('type'));
        console.log();
      }
      throw new Error(`${thisFileName}grammar has attribute errors`);
    }
    if (config.displayRuleDependencies) {
      console.log(api.displayRuleDependencies('type'));
      console.log();
    }
    if (config.displayAttributes) {
      console.log(api.displayAttributes('type'));
      console.log();
    }

    /* generate a JavaScript parser, if requested */
    if (config.outfd) {
      fs.writeSync(config.outfd, api.toSource(config.funcName));
      console.log(`\nJavaScript parser generated: ${config.outFilename}`);
    }
  } catch (e) {
    let msg = 'EXCEPTION THROWN: ';
    if (e instanceof Error) {
      msg += `${e.name}: ${e.message}`;
    } else if (typeof e === 'string') {
      msg += e;
    } else {
      msg += '\n';
      msg += util.inspect(e, {
        showHidden: true,
        depth: null,
        colors: true,
      });
    }
    console.log(msg);
  }
};
