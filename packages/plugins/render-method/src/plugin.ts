import { UnsignedVC, TemplateRenderMethod } from '@learncard/types';

import {
    AttachRenderMethodConfig,
    RenderMethodDependentLearnCard,
    RenderMethodPlugin,
    RENDER_METHOD_CONTEXT,
} from './types';
import {
    buildRenderData,
    findRenderMethod,
    findRenderMethods,
    findTemplateRenderMethod,
    findTemplateRenderMethods,
    getRenderMethods,
    getSvgMustacheRenderMethod,
} from './read';

/**
 * The default hosted SVG Mustache template, served from `packages/render-method-templates/`.
 *
 * Exported so callers can opt in to the default explicitly:
 *
 *     lc.invoke.attachRenderMethod(vc, { templateId: DEFAULT_TEMPLATE_ID })
 *
 * Per the opt-in contract for `attachRenderMethod`, calling without a config will NOT attach this
 * template — callers must be explicit.
 */
export const DEFAULT_TEMPLATE_ID = 'https://templates.learncard.com/svg/card/card-1.0.0.svg';

/**
 * Validates a `templateId` URL. Only `http://` and `https://` schemes are accepted.
 *
 * Why this exists: the `templateId` is fetched at render time. Permitting `javascript:`,
 * `file:`, or empty strings would expose the renderer to obvious script-injection or
 * local-file-read vectors. The renderer (`renderSvgMustache`) also runs DOMPurify as a
 * second line of defense, but blocking unsafe schemes at the source is cheaper.
 */
const isValidTemplateId = (templateId: string): boolean => {
    if (!templateId || !templateId.trim()) return false;
    return /^https?:\/\//i.test(templateId);
};

/**
 * Builds a `TemplateRenderMethod` from the given config. Inline `templateValue` takes priority
 * and is URL-encoded into a `data:image/svg+xml,...` URI. Otherwise `templateId` is used as-is.
 *
 * @throws if neither `templateId` nor `templateValue` is provided, if `templateId` is not http(s),
 *         or if `templateValue` is empty.
 */
export const buildTemplateRenderMethod = (
    config: AttachRenderMethodConfig
): TemplateRenderMethod => {
    let template: string;

    if ('templateValue' in config && config.templateValue !== undefined) {
        if (!config.templateValue.trim()) {
            throw new Error(
                'buildTemplateRenderMethod: `templateValue` must be a non-empty SVG string.'
            );
        }
        template = `data:image/svg+xml,${encodeURIComponent(config.templateValue)}`;
    } else if ('templateId' in config && config.templateId !== undefined) {
        if (!isValidTemplateId(config.templateId)) {
            throw new Error(
                `buildTemplateRenderMethod: \`templateId\` must be an http(s) URL, got: ${config.templateId}`
            );
        }
        template = config.templateId;
    } else {
        throw new Error(
            'buildTemplateRenderMethod: must provide either `templateId` or `templateValue` in config.'
        );
    }

    return {
        type: 'TemplateRenderMethod',
        // TODO: Add other render suites (e.g., WebRenderingTemplate2022, HtmlMustacheRenderingTemplate)
        renderSuite: 'svg-mustache',
        template,
        // Only include renderProperty when explicitly provided to avoid overriding VC defaults
        ...(config.renderProperty ? { renderProperty: config.renderProperty } : {}),
        // TODO: Make mediaType configurable per renderSuite once additional suites are supported
        outputPreference: { mediaType: 'image/svg+xml' as const },
    };
};

/**
 * Attaches a `TemplateRenderMethod` to an unsigned VC, merging with any existing `renderMethod`
 * entries. Injects the render-method JSON-LD context if not already present.
 *
 * **Opt-in semantics:** If `config` is omitted, the VC is returned UNCHANGED. The caller must
 * explicitly opt in by providing `templateId` or `templateValue`. Pass `DEFAULT_TEMPLATE_ID` to
 * use the default hosted template.
 *
 * This contract intentionally avoids polluting every issued credential's `@context` with the
 * draft render-method context URL. See `RENDER_METHOD_CONTEXT` for the rationale.
 */
export const attachRenderMethod = (
    vc: UnsignedVC,
    config?: AttachRenderMethodConfig
): UnsignedVC => {
    // Opt-in: no config → no-op. Callers must explicitly choose a template.
    if (!config) return vc;

    const renderMethod = buildTemplateRenderMethod(config);

    // Normalize @context to an array so we can safely append to it.
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
        attachRenderMethod: (_lc, vc, config) => attachRenderMethod(vc, config),
        buildTemplateRenderMethod: (_lc, config) => buildTemplateRenderMethod(config),
        getRenderMethods: (_lc, vc) => getRenderMethods(vc),
        findRenderMethod: (_lc, vc, predicate) => findRenderMethod(vc, predicate),
        findRenderMethods: (_lc, vc, predicate) => findRenderMethods(vc, predicate),
        findTemplateRenderMethod: (_lc, vc, suite) => findTemplateRenderMethod(vc, suite),
        findTemplateRenderMethods: (_lc, vc, suite) => findTemplateRenderMethods(vc, suite),
        getSvgMustacheRenderMethod: (_lc, vc) => getSvgMustacheRenderMethod(vc),
        buildRenderData: (_lc, vc, renderProperty) => buildRenderData(vc, renderProperty),
    },
});
