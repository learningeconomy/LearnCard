import tsParser from '@typescript-eslint/parser';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import i18next from 'eslint-plugin-i18next';
import reactHooks from 'eslint-plugin-react-hooks';
import noFrozenI18nMemo from './eslint-rules/no-frozen-i18n-memo.js';
import noModuleScopeI18n from './eslint-rules/no-module-scope-i18n.js';

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
                    'no-frozen-i18n-memo': noFrozenI18nMemo,
                    'no-module-scope-i18n': noModuleScopeI18n,
                },
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            'jsx-a11y/no-autofocus': 'off',
            'i18next/no-literal-string': 'off',
            'react-hooks/exhaustive-deps': 'off',
            'local/no-frozen-i18n-memo': 'error',
            'local/no-module-scope-i18n': 'error',
        },
    },
];
