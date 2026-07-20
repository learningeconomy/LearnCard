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

const findEagerTranslation = root => {
    let found = null;
    const walk = node => {
        if (found || !node || typeof node.type !== 'string') return;
        if (DEFERRED.has(node.type)) return;
        if (isTranslationCall(node)) {
            found = node;
            return;
        }
        for (const key of Object.keys(node)) {
            if (key === 'parent') continue;
            const value = node[key];
            if (Array.isArray(value)) value.forEach(walk);
            else walk(value);
        }
    };
    walk(root);
    return found;
};

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow resolving Paraglide messages inside a useMemo without a locale dependency',
        },
        schema: [],
        messages: {
            frozen: 'Translation resolved inside useMemo without a locale dependency — it will stay in the mount-time locale after a language switch. Add `locale` (from useLocale()) to the dependency array, or remove the useMemo.',
        },
    },
    create(context) {
        const source = context.getSourceCode();

        return {
            CallExpression(node) {
                if (node.callee.type !== 'Identifier' || node.callee.name !== 'useMemo') return;

                const [factory, deps] = node.arguments;
                if (!factory || !deps || deps.type !== 'ArrayExpression') return;
                if (/locale/i.test(source.getText(deps))) return;

                const body = DEFERRED.has(factory.type) ? factory.body : factory;
                const offender = findEagerTranslation(body);
                if (offender) context.report({ node: offender, messageId: 'frozen' });
            },
        };
    },
};
