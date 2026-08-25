import { fixupPluginRules } from '@eslint/compat';
import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            '**/.nx/**',
            '**/.nx-cache/**',
            '**/storybook-static/**',
            '**/.vite*/**',
            '**/public/build/**',
            '**/swagger-ui/**',
            '**/*.d.ts',
            'lib/didkit/**',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{js,jsx,ts,tsx,mjs,mts}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parserOptions: {
                ecmaFeatures: { jsx: true },
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            import: fixupPluginRules(importPlugin),
            prettier: prettierPlugin,
            react: fixupPluginRules(react),
            'react-hooks': fixupPluginRules(reactHooks),
            'jsx-a11y': fixupPluginRules(jsxA11y),
        },
        settings: {
            react: { version: 'detect' },
            'import/resolver': {
                typescript: true,
            },
        },
        rules: {
            ...react.configs.recommended.rules,
            ...reactHooks.configs['recommended-latest'].rules,
            indent: 'off',
            curly: ['warn', 'multi-line'],
            radix: 'off',
            'arrow-parens': 'off',
            'react/jsx-indent': ['error', 4],
            'react/jsx-indent-props': ['error', 4],
            'react/jsx-filename-extension': 'off',
            'react/prop-types': 'off',
            'import/extensions': 'off',
            'import/no-unresolved': 'off',
            'import/no-cycle': 'off',
            'import/no-absolute-path': 'off',
            'no-prototype-builtins': 'off',
            'prettier/prettier': 'error',
            'no-param-reassign': 'off',
            'no-underscore-dangle': 'off',
            'nonblock-statement-body-position': ['error', 'beside'],
            'no-trailing-spaces': 'off',
            'operator-linebreak': 'off',
            'no-shadow': 'off',
            '@typescript-eslint/no-shadow': 'warn',
            'max-len': 'off',
            'comma-dangle': 'off',
            'no-console': 'off',
            'function-paren-newline': 'off',
            'implicit-arrow-linebreak': 'off',
            'arrow-body-style': 'off',
            'one-var': 'off',
            'consistent-return': 'off',
            'jsx-a11y/click-events-have-key-events': 'off',
            'jsx-a11y/no-static-element-interactions': 'off',
            'object-curly-newline': 'off',
            'react/no-array-index-key': 'off',
            'react/no-unescaped-entities': 'off',
            'react/react-in-jsx-scope': 'off',
            'no-use-before-define': 'off',
            'no-alert': 'off',
            'class-methods-use-this': 'off',
            'no-fallthrough': 'off',
            'react/jsx-props-no-spreading': 'warn',
            camelcase: 'off',
            'prefer-arrow-callback': ['warn', { allowNamedFunctions: true }],
            '@typescript-eslint/naming-convention': 'off',
            'react/require-default-props': 'off',
            'import/no-extraneous-dependencies': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
        },
    },
    {
        files: ['apps/learn-card-app/src/**/*.{ts,tsx}', 'apps/scouts/src/**/*.{ts,tsx}'],
        rules: {
            'no-console': 'warn',
            // Existing app code predates React Compiler linting. Keep the runtime hooks rules
            // enforced while these compiler diagnostics are paid down file by file.
            'react-hooks/static-components': 'off',
            'react-hooks/use-memo': 'off',
            'react-hooks/preserve-manual-memoization': 'off',
            'react-hooks/incompatible-library': 'off',
            'react-hooks/immutability': 'off',
            'react-hooks/globals': 'off',
            'react-hooks/refs': 'off',
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/error-boundaries': 'off',
            'react-hooks/purity': 'off',
            'react-hooks/set-state-in-render': 'off',
            'react-hooks/unsupported-syntax': 'off',
            'react-hooks/config': 'off',
            'react-hooks/gating': 'off',
            'react-hooks/void-use-memo': 'off',
        },
    },
    {
        files: ['apps/*/src/components/network-prompts/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': [
                'warn',
                {
                    paths: [
                        {
                            name: 'learn-card-base',
                            importNames: ['useIsLoggedIn'],
                            message:
                                'Use useAuthStatus() + shouldPromptProfileOnboarding() from learn-card-base instead.',
                        },
                        {
                            name: 'learn-card-base/stores/currentUserStore',
                            importNames: ['useIsLoggedIn', 'default'],
                            message:
                                'Use useAuthStatus() + shouldPromptProfileOnboarding() from learn-card-base instead.',
                        },
                    ],
                    patterns: [
                        {
                            group: ['**/stores/currentUserStore'],
                            message:
                                'Use useAuthStatus() + shouldPromptProfileOnboarding() from learn-card-base instead.',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: [
            'apps/learn-card-app/src/**/*.{ts,tsx}',
            'apps/scouts/src/**/*.{ts,tsx}',
            'packages/learn-card-base/src/**/*.{ts,tsx}',
            'services/learn-card-network/{brain-service,lca-api,learn-cloud-service}/src/**/*.{ts,tsx}',
            'services/learn-card-network/{brain-service,lca-api,learn-cloud-service}/lambda.ts',
            'services/learn-card-network/{brain-service,lca-api,learn-cloud-service}/*Lambda.ts',
        ],
        ignores: ['**/*.{test,spec}.{ts,tsx}', '**/config/environment.ts'],
        rules: {
            'no-restricted-syntax': [
                'error',
                {
                    selector:
                        "MemberExpression[object.object.name='process'][object.property.name='env']",
                    message:
                        'Read deployment values from the validated project environment module.',
                },
                {
                    selector:
                        "MemberExpression[object.object.type='MetaProperty'][object.property.name='env']",
                    message:
                        'Read browser build values from the validated project environment module.',
                },
            ],
        },
    },
    prettier
);
