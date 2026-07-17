// Standalone config for the frozen-translation-memo guard.
//
// Kept separate from .eslintrc-i18n.cjs because that one enables
// i18next/no-literal-string, which is only meaningful over the already-localized
// areas (appStoreDeveloper / appStoreAdmin). The frozen-memo bug is app-wide, so
// this config carries ONLY the custom rule and runs over all of src.
module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
    rules: {
        'no-frozen-i18n-memo': 'error',
    },
};
