export default {
    locales: ['en', 'es', 'fr', 'ar'],
    input: ['src/**/*.{ts,tsx}'],
    output: 'public/locales/$LOCALE/$NAMESPACE.json',
    defaultNamespace: 'translation',
    keepRemoved: true,
    sort: true,
    createOldCatalogs: false,
    keySeparator: '.',
    namespaceSeparator: false,
    failOnUpdate: true, // FLASH-OF-KEY MITIGATION: blocks merges with missing default values
    defaultValue: (locale: string, namespace: string, key: string) => {
        // Surface keys that lack second-arg defaults loudly
        if (locale === 'en') return '__MISSING_DEFAULT__';
        return '';
    },
};
