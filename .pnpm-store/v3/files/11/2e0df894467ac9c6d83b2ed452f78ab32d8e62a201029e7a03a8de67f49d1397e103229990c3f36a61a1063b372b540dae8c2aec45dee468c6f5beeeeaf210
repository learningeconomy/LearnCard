// Reads the apglib.css file and outputs a JavaScript function

// which will return the CSS as a string.
module.exports = function cssToJs(inFile, outFile) {
  // function capFirst(str) {
  //     return str.charAt(0).toUpperCase() + str.slice(1);
  // }

  function getFileExtension(filename) {
    // eslint-disable-next-line no-bitwise
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
  }

  const fs = require('fs');
  try {
    /* validate arguments */
    if (!inFile) {
      throw new Error('missing input CSS file (name.css)');
    }
    if (getFileExtension(inFile) !== 'css') {
      throw new Error(`input CSS file (${inFile}) must have .css extension`);
    }
    if (!outFile) {
      throw new Error('missing output JavaScript file (name.js)');
    }
    if (getFileExtension(outFile) !== 'js') {
      throw new Error(`output JavaScript file (${outFile}) must have .js extension`);
    }
    const cssBuf = fs.readFileSync(inFile);
    let cssStr = '';
    for (let i = 0; i < cssBuf.length; i += 1) {
      const char = cssBuf[i];
      if (char >= 32 && char <= 38) {
        cssStr += String.fromCharCode(char);
      } else if (char >= 40 && char <= 91) {
        cssStr += String.fromCharCode(char);
      } else if (char >= 93 && char <= 126) {
        cssStr += String.fromCharCode(char);
      } else {
        switch (char) {
          case 9:
            cssStr += '\\t';
            break;
          case 10:
            cssStr += '\\n';
            break;
          case 13:
            cssStr += '\\r';
            break;
          case 39:
            cssStr += "\\'";
            break;
          case 92:
            cssStr += '\\\\';
            break;
          default:
            /* ignore invalid string characters */
            break;
        }
      }
    }

    let js = '// This module has been developed programmatically in the `apg-lib` build process.\n';
    js +=
      '// It is used to build web pages programatically on the fly without the need for <script> or <style> tags.\n';
    js += '\n';
    js += 'module.exports = function emittcss(){\n';
    js += `return '${cssStr}';`;
    js += '\n}\n';
    fs.writeFileSync(outFile, js);
  } catch (e) {
    console.log('cssToJS.js: EXCEPTION: \n');
    console.log(e.message);
  }
};
