import { Plugin, LearnCard } from '@learncard/core';
import { UnsignedVC, TemplateRenderMethod } from '@learncard/types';

/**
 * JSON-LD context for W3C `renderMethod`.
 *
 * ⚠️ DRAFT CONTEXT WARNING
 * This URL points to a community-group draft hosted on Digital Bazaar's GitHub Pages, not a
 * finalized W3C TR. The `v2rc2` suffix means "v2, release candidate 2".
 *
 * Risks of issuing VCs that reference this URL in their `@context`:
 * - URL could move, be renamed, or 404 — JSON-LD context resolution would fail at verification time.
 * - Term definitions could change between rc2 and a final spec, breaking interpretation.
 * - Not statically cached by DidKit — verification incurs a network fetch.
 *
 * Mitigation plan (not yet implemented):
 * - Bundle the context locally (see `packages/learn-card-contexts/` for the prior pattern).
 * - Migrate to a stable W3C TR context URL when the spec finalizes.
 *
 * Tracking: https://www.w3.org/TR/vc-render-method/ (when published).
 */
export const RENDER_METHOD_CONTEXT =
    'https://digitalbazaar.github.io/vc-render-method-context/contexts/v2rc2.jsonld';

/**
 * Config for building a render method. Exactly one of `templateId` or `templateValue` must be
 * provided — the discriminated union enforces this at compile time.
 *
 * - `templateId`: HTTPS URL of a hosted SVG Mustache template (only `http://` or `https://` is accepted).
 * - `templateValue`: Inline SVG Mustache content (URL-encoded into a `data:image/svg+xml,` URI).
 * - `renderProperty`: Optional JSON Pointer paths (RFC 6901) scoping which VC fields are exposed
 *   to the template.
 */
export type AttachRenderMethodConfig =
    | { templateId: string; templateValue?: never; renderProperty?: string[] }
    | { templateValue: string; templateId?: never; renderProperty?: string[] };

export type RenderMethodPluginMethods = {
    /**
     * Attaches a `TemplateRenderMethod` to an unsigned VC and injects the render-method JSON-LD
     * context. Merges with any existing `renderMethod` entries.
     *
     * **Opt-in:** returns the VC unchanged if `config` is omitted. Callers must explicitly choose
     * a template. Pass `{ templateId: DEFAULT_TEMPLATE_ID }` to use the default hosted LearnCard
     * template.
     *
     * @throws if `templateId` is not an http(s) URL, or if `templateValue` is empty.
     */
    attachRenderMethod: (vc: UnsignedVC, config?: AttachRenderMethodConfig) => UnsignedVC;
    /**
     * Builds a `TemplateRenderMethod` descriptor without mutating a VC. Useful when callers need
     * to compose the descriptor independently.
     *
     * @throws if `templateId` is not an http(s) URL, or if `templateValue` is empty.
     */
    buildTemplateRenderMethod: (config: AttachRenderMethodConfig) => TemplateRenderMethod;
};

/**
 * This plugin is stateless and has no required dependent methods or control planes. It accepts
 * any wallet stack.
 */
export type RenderMethodDependentLearnCard = LearnCard<any[]>;

export type RenderMethodPlugin = Plugin<
    'Render Method',
    never,
    RenderMethodPluginMethods,
    never,
    Record<never, never>
>;
