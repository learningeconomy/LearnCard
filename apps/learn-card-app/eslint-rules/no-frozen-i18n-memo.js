/**
 * Flags translations resolved *eagerly* inside a `useMemo` whose dependency
 * array has no locale dependency.
 *
 * Paraglide resolves the active locale at call time, so `m['key']()` inside
 * `useMemo(..., [somethingElse])` is captured once and never recomputed on a
 * runtime language switch — the string stays stuck in the mount-time locale.
 * This has now been shipped (and review-caught) several times.
 *
 * Only `useMemo` is checked. `useCallback` bodies are event handlers that run
 * when invoked, so they re-resolve the locale each time and never freeze.
 * Likewise, a translation nested inside a function *returned* or created by the
 * memo (e.g. `useMemo(() => async () => m['x'](), deps)`) is deferred, so this
 * rule deliberately does not descend into nested function bodies.
 *
 * Fix: add `locale` (from `useLocale()`) to the dependency array — preferred
 * when the memo is load-bearing (stable prop identity, shuffle-once, etc.) — or
 * drop the `useMemo` when it was only caching a trivial string.
 */
'use strict';

/** `m['key'](…)`, `m.key(…)`, or `mDynamic(key, …)` */
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

/** First eagerly-evaluated translation call in `root`, skipping nested functions. */
const findEagerTranslation = root => {
    let found = null;
    const walk = node => {
        if (found || !node || typeof node.type !== 'string') return;
        if (DEFERRED.has(node.type)) return; // runs later — locale resolves then
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

                // A locale dep (any identifier/member mentioning "locale") is the fix.
                if (/locale/i.test(source.getText(deps))) return;

                const body = DEFERRED.has(factory.type) ? factory.body : factory;
                const offender = findEagerTranslation(body);
                if (offender) context.report({ node: offender, messageId: 'frozen' });
            },
        };
    },
};
