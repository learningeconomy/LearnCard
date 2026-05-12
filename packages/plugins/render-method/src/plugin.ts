import { UnsignedVC, TemplateRenderMethod } from '@learncard/types';

import {
    AttachRenderMethodConfig,
    RenderMethodDependentLearnCard,
    RenderMethodPlugin,
    RENDER_METHOD_CONTEXT,
} from './types';

const DEFAULT_TEMPLATE_ID = 'https://templates.learncard.com/svg/card/card-1.0.0.svg';

// ! for now we only support svg-mustache
// TODO: Add other render suites and media types

/** Builds a TemplateRenderMethod object from the given config.
 * If templateValue is provided, it is embedded as a data URI; otherwise templateId or the default template is used. */
export const buildTemplateRenderMethod = (
    config?: AttachRenderMethodConfig
): TemplateRenderMethod =>
    ({
        type: 'TemplateRenderMethod',
        renderSuite: 'svg-mustache', // TODO: Add other render suites
        // Inline SVG takes priority over a template ID reference
        template: config?.templateValue
            ? `data:image/svg+xml,${encodeURIComponent(config.templateValue)}`
            : config?.templateId ?? DEFAULT_TEMPLATE_ID,
        // Only include renderProperty when explicitly provided to avoid overriding VC defaults
        ...(config?.renderProperty ? { renderProperty: config.renderProperty } : {}),
        outputPreference: { mediaType: 'image/svg+xml' },
    } as unknown as TemplateRenderMethod);

/** Attaches a TemplateRenderMethod to an unsigned VC, merging with any existing renderMethod entries.
 * Also injects the render method JSON-LD context if not already present. */
export const attachRenderMethod = (
    vc: UnsignedVC,
    config?: AttachRenderMethodConfig
): UnsignedVC => {
    const renderMethod = buildTemplateRenderMethod(config);

    // Normalize @context to an array so we can safely append to it
    const context = Array.isArray(vc['@context']) ? vc['@context'] : [vc['@context']];
    const updatedContext = context.includes(RENDER_METHOD_CONTEXT)
        ? context
        : [...context, RENDER_METHOD_CONTEXT];

    const existingRenderMethod = vc.renderMethod;
    let updatedRenderMethod: TemplateRenderMethod | TemplateRenderMethod[];

    if (!existingRenderMethod) {
        // No prior renderMethod — set directly (spec allows a single object, not just arrays)
        updatedRenderMethod = renderMethod;
    } else if (Array.isArray(existingRenderMethod)) {
        // Append to the existing array
        updatedRenderMethod = [...(existingRenderMethod as TemplateRenderMethod[]), renderMethod];
    } else {
        // Wrap the single existing entry together with the new one
        updatedRenderMethod = [existingRenderMethod as TemplateRenderMethod, renderMethod];
    }

    return {
        ...vc,
        '@context': updatedContext,
        renderMethod: updatedRenderMethod,
    };
};

export const getRenderMethodPlugin = (
    _learnCard: RenderMethodDependentLearnCard
): RenderMethodPlugin => ({
    name: 'Render Method',
    displayName: 'Render Method Plugin',
    description:
        'Attaches W3C renderMethod to Verifiable Credentials for standards-based rendering',
    methods: {
        attachRenderMethod: (_lc, vc, config?) => attachRenderMethod(vc, config),
        buildTemplateRenderMethod: (_lc, config?) => buildTemplateRenderMethod(config),
    },
});
