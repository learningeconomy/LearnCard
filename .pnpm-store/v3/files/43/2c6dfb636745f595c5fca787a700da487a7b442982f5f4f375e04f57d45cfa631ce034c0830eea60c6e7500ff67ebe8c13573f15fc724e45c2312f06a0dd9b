'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var babelJest = require('babel-jest');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var babelJest__default = /*#__PURE__*/_interopDefaultLegacy(babelJest);

const { process  } = babelJest__default['default'].createTransformer({
    plugins: [
        "@babel/plugin-transform-modules-commonjs"
    ],
    parserOpts: {
        plugins: [
            "jsx",
            "typescript"
        ]
    }
});
function babelTransform(opts) {
    const { sourceText , sourcePath , config , options  } = opts;
    const babelResult = process(sourceText, sourcePath, config, options);
    return babelResult.code;
}

exports.babelTransform = babelTransform;
