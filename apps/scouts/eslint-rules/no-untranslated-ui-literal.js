'use strict';

const UI_CALLEES =
    /(?:presentToast|showConfirmationAlert|showConfirmation|setError|setSuccess|setMessage|alert|confirm)$/i;
const UI_PROPERTIES = new Set([
    'alt',
    'ariaLabel',
    'buttonText',
    'description',
    'emptyMessage',
    'errorMessage',
    'header',
    'footerSubText',
    'idTypeText',
    'label',
    'loadingText',
    'message',
    'placeholder',
    'subText',
    'successMessage',
    'text',
    'title',
]);
const NON_COPY_PROPERTIES = new Set(['role']);
const isNonCopyProperty = name =>
    NON_COPY_PROPERTIES.has(name) || /(?:className|cssClass)$/i.test(String(name ?? ''));

const hasVisibleCopy = value => {
    const text = String(value ?? '').trim();
    if (!text || /^(?:https?:|did:|lc:|[/#.])/.test(text)) return false;
    return /\p{L}{2}/u.test(text);
};

const propertyName = node => node?.key?.name ?? node?.key?.value;

const isUserFacingScope = (context, node) => {
    const source = context.getSourceCode();
    let current = node.parent;

    while (current && current.type !== 'Program') {
        if (current.type === 'JSXElement' || current.type === 'JSXFragment') return false;
        if (current.type === 'Property') {
            const name = propertyName(current);
            if (isNonCopyProperty(name)) return false;
            if (UI_PROPERTIES.has(name)) return true;
        }
        if (current.type === 'CallExpression') {
            return UI_CALLEES.test(source.getText(current.callee));
        }
        current = current.parent;
    }

    return false;
};

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow untranslated copy in user-facing calls and configuration objects',
        },
        schema: [],
        messages: {
            untranslated: 'User-facing literal must come from the Paraglide catalog.',
        },
    },
    create(context) {
        return {
            Literal(node) {
                if (typeof node.value !== 'string' || !hasVisibleCopy(node.value)) return;
                if (['ImportDeclaration', 'ExportNamedDeclaration'].includes(node.parent?.type)) {
                    return;
                }
                if (isUserFacingScope(context, node)) {
                    context.report({ node, messageId: 'untranslated' });
                }
            },
            TemplateLiteral(node) {
                const copy = node.quasis.map(quasi => quasi.value.cooked ?? '').join(' ');
                if (hasVisibleCopy(copy) && isUserFacingScope(context, node)) {
                    context.report({ node, messageId: 'untranslated' });
                }
            },
        };
    },
};
