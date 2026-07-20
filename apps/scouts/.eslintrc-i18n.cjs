module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
    plugins: ['i18next'],
    rules: {
        'i18next/no-literal-string': [
            'warn',
            {
                mode: 'jsx-text-only',
                'jsx-components': { exclude: ['Trans','CodeBlock','CodeOutputPanel','Code','Pre','SyntaxHighlighter','pre','code'] }, // JSX text nodes only (visible UI text, incl multi-line)
                'jsx-attributes': {
                    exclude: [
                        'className', 'class', 'data-testid', 'id', 'href', 'src', 'to', 'key',
                        'type', 'role', 'style', 'color', 'bgColor', 'variant', 'value', 'name',
                        'target', 'rel', 'width', 'height', 'viewBox', 'fill', 'stroke', 'xmlns',
                        'd', 'strokeWidth', 'aria-hidden', 'htmlFor', 'autoComplete', 'inputMode',
                        'accept', 'rows', 'cols', 'min', 'max', 'step', 'maxLength', 'icon', 'size',
                    ],
                },
                words: {
                    exclude: [
                        'LearnCard', 'Boost', 'OBv3', 'JSON', 'API', 'DID', 'CSV', 'HTML', 'URL',
                        'URI', 'REST', 'SDK', 'iframe', 'OAuth', 'LMS', 'VC', 'VCs', 'npm', 'yarn',
                        'pnpm', 'ID', 'OK', 'AI',
                        // ScoutPass brand / domain tokens
                        'ScoutPass', 'Scout', 'Scouts', 'Troop', 'TroopID', 'Campfire', 'BSA',
                    ],
                },
            },
        ],
    },
};
