import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import i18next from 'eslint-plugin-i18next';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';

import noUntranslatedUiLiteral from './eslint-rules/no-untranslated-ui-literal.js';

export default [
    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
        },
        plugins: {
            '@typescript-eslint': tseslintPlugin,
            'jsx-a11y': jsxA11y,
            i18next,
            'react-hooks': reactHooks,
            local: {
                rules: {
                    'no-untranslated-ui-literal': noUntranslatedUiLiteral,
                },
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            'jsx-a11y/no-autofocus': 'off',
            'react-hooks/exhaustive-deps': 'off',
            'local/no-untranslated-ui-literal': 'error',
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
                        include: [
                            'presentToast',
                            'showConfirmationAlert',
                            'setError',
                            'setSuccess',
                        ],
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
    },
];
