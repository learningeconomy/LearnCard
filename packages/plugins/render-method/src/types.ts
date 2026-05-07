import { Plugin, LearnCard } from '@learncard/core';
import { UnsignedVC, TemplateRenderMethod } from '@learncard/types';

export const RENDER_METHOD_CONTEXT = 'https://digitalbazaar.github.io/vc-render-method-context/contexts/v2rc2.jsonld';

export type AttachRenderMethodConfig =
    | { /** URL of the hosted SVG Mustache template. */ templateId: string; templateValue?: never; renderProperty?: string[] }
    | { /** Inline SVG Mustache template content (encoded as a data URI). */ templateValue: string; templateId?: never; renderProperty?: string[] };

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
