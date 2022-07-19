/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This module parses an input SABNF grammar string into a grammar object.
// Errors are reported as an array of error message strings.
// To be called only by the `apg-exp` contructor.
// ```
// input - required, a string containing the SABNF grammar
// errors - required, must be an array
// ```
module.exports = function sabnfGenerator(input) {
  'use strict;';

  const Api = require('../apg-api/api');

  const errorName = 'apg-exp: generator: ';
  const result = { obj: null, error: null, text: null, html: null };
  const grammarTextTitle = 'annotated grammar:\n';
  const textErrorTitle = 'annotated grammar errors:\n';
  function resultError(api, resultArg, header) {
    resultArg.error = header;
    resultArg.text = grammarTextTitle;
    resultArg.text += api.linesToAscii();
    resultArg.text += textErrorTitle;
    resultArg.text += api.errorsToAscii();
    resultArg.html = api.linesToHtml();
    resultArg.html += api.errorsToHtml();
  }

  let api;
  const TRUE = true;
  while (TRUE) {
    /* verify the input string - preliminary analysis */
    try {
      api = new Api(input);
      api.scan();
    } catch (e) {
      result.error = errorName + e.msg;
      break;
    }
    if (api.errors.length) {
      resultError(api, result, 'grammar has validation errors');
      break;
    }

    /* syntax analysis of the grammar */
    api.parse();
    if (api.errors.length) {
      resultError(api, result, 'grammar has syntax errors');
      break;
    }

    /* semantic analysis of the grammar */
    api.translate();
    if (api.errors.length) {
      resultError(api, result, 'grammar has semantic errors');
      break;
    }

    /* attribute analysis of the grammar */
    api.attributes();
    if (api.errors.length) {
      resultError(api, result, 'grammar has attribute errors');
      break;
    }

    /* finally, generate a grammar object */
    result.obj = api.toObject();
    break;
  }
  return result;
};
