'use strict';

const isTranslationCall = node => {
    if (!node || node.type !== 'CallExpression') return false;
    const callee = node.callee;
    if (callee.type === 'Identifier' && callee.name === 'mDynamic') return true;
    return (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'm'
    );
};

const DEFERRED = new Set(['ArrowFunctionExpression', 'FunctionExpression', 'FunctionDeclaration']);

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow resolving Paraglide messages at module scope (frozen at import, ignores locale switches)',
        },
        schema: [],
        messages: {
            frozen: 'Paraglide message resolved at module scope — frozen at import time, never updates on a locale switch (often to the pre-locale default). Move it into a function resolved at render, or store the key and resolve where it renders.',
        },
    },
    create(context) {
        return {
            Program(program) {
                const walk = (node, inFn) => {
                    if (!node || typeof node.type !== 'string') return;
                    if (DEFERRED.has(node.type)) inFn = true;
                    if (!inFn && isTranslationCall(node)) {
                        context.report({ node, messageId: 'frozen' });
                    }
                    for (const key of Object.keys(node)) {
                        if (key === 'parent') continue;
                        const value = node[key];
                        if (Array.isArray(value)) value.forEach(v => walk(v, inFn));
                        else if (value && typeof value.type === 'string') walk(value, inFn);
                    }
                };
                walk(program, false);
            },
        };
    },
};
