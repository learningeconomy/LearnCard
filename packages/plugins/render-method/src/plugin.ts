import { UnsignedVC, TemplateRenderMethod } from '@learncard/types';

import {
    AttachRenderMethodConfig,
    RenderMethodDependentLearnCard,
    RenderMethodPlugin,
    RENDER_METHOD_CONTEXT,
} from './types';

const DEFAULT_TEMPLATE_ID = 'https://templates.learncard.com/svg/1.0.0/id-card.svg';

// ! for now we only support svg-mustache
// TODO: Add other render suites and media types

const buildTemplateRenderMethod = (config?: AttachRenderMethodConfig): TemplateRenderMethod => ({
    type: 'TemplateRenderMethod',
    renderSuite: 'svg-mustache', // TODO: Add other render suites
    template: {
        ...(config?.templateValue ? { value: config.templateValue } : { id: config?.templateId ?? DEFAULT_TEMPLATE_ID }),
        mediaType: 'image/svg+xml', // TODO: Add other media types
        ...(config?.digestMultibase ? { digestMultibase: config.digestMultibase } : {}),
        ...(config?.renderProperty ? { renderProperty: config.renderProperty } : {}),
    },
} as TemplateRenderMethod);

const attachRenderMethod = (vc: UnsignedVC, config?: AttachRenderMethodConfig): UnsignedVC => {
    const renderMethod = buildTemplateRenderMethod(config);

    const context = Array.isArray(vc['@context']) ? vc['@context'] : [vc['@context']];
    const updatedContext = context.includes(RENDER_METHOD_CONTEXT)
        ? context
        : [...context, RENDER_METHOD_CONTEXT];

    const existingRenderMethod = vc.renderMethod;
    let updatedRenderMethod: TemplateRenderMethod | TemplateRenderMethod[];

    if (!existingRenderMethod) {
        updatedRenderMethod = renderMethod;
    } else if (Array.isArray(existingRenderMethod)) {
        updatedRenderMethod = [...(existingRenderMethod as TemplateRenderMethod[]), renderMethod];
    } else {
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
