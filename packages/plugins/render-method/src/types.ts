import { Plugin, LearnCard } from '@learncard/core';
import { UnsignedVC, TemplateRenderMethod } from '@learncard/types';

export const RENDER_METHOD_CONTEXT = 'https://w3id.org/vc/render-method/v1';

type AttachRenderMethodConfigBase = {
    /** Optional SHA-256 multibase digest of the template for integrity verification. */
    digestMultibase?: string;
    /** JSON Pointer paths (RFC 6901) limiting which VC fields are exposed to the template. */
    renderProperty?: string[];
};

export type AttachRenderMethodConfig =
    | (AttachRenderMethodConfigBase & { /** URL of the hosted SVG Mustache template. */ templateId: string; templateValue?: never })
    | (AttachRenderMethodConfigBase & { /** Inline base64-encoded SVG Mustache template content. */ templateValue: string; templateId?: never });

export type RenderMethodPluginMethods = {
    attachRenderMethod: (vc: UnsignedVC, config?: AttachRenderMethodConfig) => UnsignedVC;
    buildTemplateRenderMethod: (config?: AttachRenderMethodConfig) => TemplateRenderMethod;
};

/** The render-method plugin is stateless and has no required dependent methods or control planes. */
export type RenderMethodDependentLearnCard = LearnCard<any>;

export type RenderMethodPlugin = Plugin<
    'Render Method',
    never,
    RenderMethodPluginMethods,
    never,
    Record<never, never>
>;
