module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
    rules: {
        'no-frozen-i18n-memo': 'error',
        'no-module-scope-i18n': 'error',
    },
};
