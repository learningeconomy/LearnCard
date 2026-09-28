type CodePluginOptions = {
    themes?: [unknown, unknown];
};

const createCodePlugin = (options: CodePluginOptions = {}) => ({
    name: 'shiki' as const,
    type: 'code-highlighter' as const,
    getSupportedLanguages: () => [],
    getThemes: () => options.themes ?? ['dracula', 'dracula'],
    supportsLanguage: () => false,
    highlight: () => null,
});

const code = createCodePlugin();

export { code, createCodePlugin };
