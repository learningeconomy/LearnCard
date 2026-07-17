/**
 * Flags Paraglide message resolution (`m['key']()` / `mDynamic(key)`) evaluated
 * at MODULE scope — i.e. inside a top-level `const`/object/array initializer that
 * runs once when the module is first imported.
 *
 * Paraglide resolves the active locale at call time. A module-level
 * `const categoryToConfig = { title: m['…']() }` captures the string when the
 * chunk first loads — typically before the user's locale is even set — and never
 * updates on a language switch. This is the same freeze as the useMemo case
 * (`no-frozen-i18n-memo`) but strictly worse: there is no dependency array to fix.
 *
 * A translation inside a function defined at module scope is fine — it defers to
 * call time — so this rule does NOT descend into function bodies.
 *
 * Fix: move the resolution to render time. Turn the frozen constant into a
 * function (`const getCategoryConfig = () => ({ title: m['…']() })`) called from
 * the component, or store the message KEY and resolve it where it renders.
 */
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

const DEFERRED = new Set([
    'ArrowFunctionExpression',
    'FunctionExpression',
    'FunctionDeclaration',
]);

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow resolving Paraglide messages at module scope (frozen at import, ignores locale switches)',
        },
        schema: [],
        messages: {
            frozen:
                'Paraglide message resolved at module scope — frozen at import time, never updates on a locale switch (often to the pre-locale default). Move it into a function resolved at render, or store the key and resolve where it renders.',
        },
    },
    create(context) {
        return {
            // Walk the whole module once from Program; report eager translation
            // calls reached without entering any function body.
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
