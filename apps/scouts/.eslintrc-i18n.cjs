module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
    plugins: ['i18next'],
    rules: {
        'no-untranslated-ui-literal': 'error',
        'i18next/no-literal-string': [
            'error',
            {
                // Include literals inside JSX expressions and accessibility/form attributes,
                // not only direct JSX text nodes. This catches `alt`, `aria-label`,
                // `placeholder`, and expressions such as `{'Visible copy'}`.
                mode: 'jsx-only',
                'jsx-components': {
                    exclude: [
                        'Trans',
                        'CodeBlock',
                        'CodeOutputPanel',
                        'Code',
                        'Pre',
                        'SyntaxHighlighter',
                        'pre',
                        'code',
                    ],
                },
                'jsx-attributes': {
                    include: ['alt', 'aria-label', 'aria-description', 'placeholder', 'title'],
                },
                // Only inspect string arguments for APIs that surface copy to users.
                // Internal identifiers passed to event/data helpers are not translations.
                callees: {
                    include: ['presentToast', 'showConfirmationAlert', 'setError', 'setSuccess'],
                },
                words: {
                    exclude: [
                        // Formatting-only fragments, numbers, and symbols are not copy.
                        /^[\s\d\p{P}\p{S}]+$/u,
                        /^[A-Z0-9_-]+$/,
                        'LearnCard',
                        'Boost',
                        'OBv3',
                        'JSON',
                        'API',
                        'DID',
                        'CSV',
                        'HTML',
                        'URL',
                        'URI',
                        'REST',
                        'SDK',
                        'iframe',
                        'OAuth',
                        'LMS',
                        'VC',
                        'VCs',
                        'npm',
                        'yarn',
                        'pnpm',
                        'ID',
                        'OK',
                        'AI',
                        // ScoutPass brand / domain tokens
                        'ScoutPass',
                        'Scout',
                        'Scouts',
                        'Troop',
                        'TroopID',
                        'Campfire',
                        'BSA',
                    ],
                },
                'should-validate-template': true,
            },
        ],
    },
};
