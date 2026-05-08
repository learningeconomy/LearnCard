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

export const buildTemplateRenderMethod = (
    config?: AttachRenderMethodConfig
): TemplateRenderMethod =>
    ({
        type: 'TemplateRenderMethod',
        renderSuite: 'svg-mustache', // TODO: Add other render suites
        template: config?.templateValue
            ? `data:image/svg+xml,${encodeURIComponent(config.templateValue)}`
            : config?.templateId ?? DEFAULT_TEMPLATE_ID,
        ...(config?.renderProperty ? { renderProperty: config.renderProperty } : {}),
        outputPreference: { mediaType: 'image/svg+xml' },
    } as unknown as TemplateRenderMethod);

export const attachRenderMethod = (
    vc: UnsignedVC,
    config?: AttachRenderMethodConfig
): UnsignedVC => {
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
