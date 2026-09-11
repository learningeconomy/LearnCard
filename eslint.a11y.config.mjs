import { fixupPluginRules } from '@eslint/compat';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';
import globals from 'globals';

const recommendedRules = Object.fromEntries(
    Object.entries(jsxA11y.configs.recommended.rules).map(([ruleName, ruleConfig]) => {
        if (Array.isArray(ruleConfig)) {
            const [severity, ...options] = ruleConfig;
            const isDisabled = severity === 0 || severity === 'off';
            return [ruleName, [isDisabled ? 'off' : 'warn', ...options]];
        }

        const isDisabled = ruleConfig === 0 || ruleConfig === 'off';
        return [ruleName, isDisabled ? 'off' : 'warn'];
    })
);

const ZERO_VIOLATION_RULES = [
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

const zeroViolationRules = Object.fromEntries(
    ZERO_VIOLATION_RULES.map(ruleName => {
        const ruleConfig = recommendedRules[ruleName];
        return [ruleName, Array.isArray(ruleConfig) ? ['error', ...ruleConfig.slice(1)] : 'error'];
    })
);

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
        ],
    },
    {
        files: ['apps/learn-card-app/src/**/*.{ts,tsx}'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaFeatures: { jsx: true },
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            globals: {
                ...globals.browser,
                ...globals.es2021,
            },
        },
        plugins: {
            'jsx-a11y': fixupPluginRules(jsxA11y),
        },
        rules: {
            ...recommendedRules,
            ...zeroViolationRules,
            'jsx-a11y/control-has-associated-label': [
                'warn',
                ...recommendedRules['jsx-a11y/control-has-associated-label'].slice(1),
            ],
        },
    }
);
