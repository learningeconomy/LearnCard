const jsxA11yRecommendedRules = Object.fromEntries(
    Object.entries(require('eslint-plugin-jsx-a11y').configs.recommended.rules).map(
        ([ruleName, ruleConfig]) => {
            if (Array.isArray(ruleConfig)) {
                const [severity, ...options] = ruleConfig;
                const isDisabled = severity === 0 || severity === 'off';
                return [ruleName, [isDisabled ? 'off' : 'warn', ...options]];
            }

            const isDisabled = ruleConfig === 0 || ruleConfig === 'off';
            return [ruleName, isDisabled ? 'off' : 'warn'];
        }
    )
);

const JSX_A11Y_ZERO_VIOLATION_RULES = [
    'jsx-a11y/anchor-ambiguous-text',
    'jsx-a11y/anchor-has-content',
    'jsx-a11y/anchor-is-valid',
    'jsx-a11y/aria-activedescendant-has-tabindex',
    'jsx-a11y/aria-props',
    'jsx-a11y/aria-proptypes',
    'jsx-a11y/aria-role',
    'jsx-a11y/aria-unsupported-elements',
    'jsx-a11y/autocomplete-valid',
    'jsx-a11y/heading-has-content',
    'jsx-a11y/html-has-lang',
    'jsx-a11y/iframe-has-title',
    'jsx-a11y/media-has-caption',
    'jsx-a11y/mouse-events-have-key-events',
    'jsx-a11y/no-access-key',
    'jsx-a11y/no-distracting-elements',
    'jsx-a11y/no-interactive-element-to-noninteractive-role',
    'jsx-a11y/no-noninteractive-tabindex',
    'jsx-a11y/role-has-required-aria-props',
    'jsx-a11y/role-supports-aria-props',
    'jsx-a11y/scope',
    'jsx-a11y/tabindex-no-positive',
];

const jsxA11yZeroViolationRules = Object.fromEntries(
    JSX_A11Y_ZERO_VIOLATION_RULES.map(ruleName => {
        const ruleConfig = jsxA11yRecommendedRules[ruleName];

        // Keep the recommended preset's options while promoting only severity.
        return [ruleName, Array.isArray(ruleConfig) ? ['error', ...ruleConfig.slice(1)] : 'error'];
    })
);

module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    env: {
        browser: true,
        es2020: true,
    },
    extends: ['plugin:react/recommended', 'airbnb-typescript', 'prettier'],
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
    },
    plugins: ['react', 'prettier', '@typescript-eslint'],
    rules: {
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
        // TODO - Get team preferences on below rules
        'nonblock-statement-body-position': ['error', 'beside'],
        'no-trailing-spaces': 'off',
        'operator-linebreak': 'off',
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'warn',
        'max-len': 'off',
        'comma-dangle': 'off',
        'no-console': 'off', // overridden per-app below
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
    overrides: [
        {
            // Keep the accessibility rollout isolated to the LearnCard app. Existing
            // violations start as warnings so work outside the core flows can move to
            // follow-up PRs; rules with a clean baseline are promoted to errors below.
            files: ['apps/learn-card-app/src/**/*.{ts,tsx}'],
            extends: ['plugin:jsx-a11y/recommended'],
            plugins: ['jsx-a11y'],
            parserOptions: {
                project: './apps/learn-card-app/tsconfig.json',
            },
            rules: {
                ...jsxA11yRecommendedRules,
                ...jsxA11yZeroViolationRules,
                // The recommended preset leaves this rule off, but it is valuable
                // for the app's icon-only controls during this rollout.
                'jsx-a11y/control-has-associated-label': [
                    'warn',
                    ...jsxA11yRecommendedRules['jsx-a11y/control-has-associated-label'].slice(1),
                ],
            },
        },
        {
            // Warn on direct console.* usage in app source — use logger from learn-card-base instead
            files: ['apps/learn-card-app/src/**/*.{ts,tsx}', 'apps/scouts/src/**/*.{ts,tsx}'],
            rules: {
                'no-console': 'warn',
            },
        },
        {
            // Auth-gate guardrail: onboarding / network-join prompts must derive
            // their decision from the canonical race-safe selector, not from raw
            // login state (which rehydrates before the wallet/key is reconstructed).
            // See packages/learn-card-base/src/auth-status.
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
                                    'Do not gate prompts on raw login state — it is true during the resume race before the wallet is ready. Use useAuthStatus() + shouldPromptProfileOnboarding() from learn-card-base instead.',
                            },
                            {
                                name: 'learn-card-base/stores/currentUserStore',
                                importNames: ['useIsLoggedIn', 'default'],
                                message:
                                    'Do not gate prompts on raw login state — it is true during the resume race before the wallet is ready. Use useAuthStatus() + shouldPromptProfileOnboarding() from learn-card-base instead.',
                            },
                        ],
                        patterns: [
                            {
                                group: ['**/stores/currentUserStore'],
                                message:
                                    'Do not gate prompts on raw login/currentUser state in network-prompts — use useAuthStatus() + shouldPromptProfileOnboarding() from learn-card-base instead.',
                            },
                        ],
                    },
                ],
            },
        },
    ],
};
