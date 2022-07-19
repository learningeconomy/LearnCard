"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const ink_1 = require("ink");
const cli_highlight_1 = require("cli-highlight");
/**
 * SyntaxHighlight.
 */
const SyntaxHighlight = ({ code, language, theme }) => {
    const highlightedCode = React.useMemo(() => {
        return cli_highlight_1.highlight(code, { language, theme });
    }, [code, language, theme]);
    return React.createElement(ink_1.Text, null, highlightedCode);
};
exports.default = SyntaxHighlight;
