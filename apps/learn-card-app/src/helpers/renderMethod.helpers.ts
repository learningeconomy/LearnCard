import Mustache from 'mustache';
import DOMPurify, { type Config as DOMPurifyConfig } from 'dompurify';

import { VC, TemplateRenderMethod } from '@learncard/types';
import { buildRenderData } from '@learncard/render-method-plugin';

/**
 * DOMPurify policy for SVG output rendered from credential data.
 *
 * Why this exists:
 * Render templates may come from remote URLs or credential-attached data URIs, and credential
 * fields are interpolated into the SVG. We sanitize after Mustache hydration because the final
 * output is what ends up in `dangerouslySetInnerHTML`.
 *
 * Important boundaries:
 * - `USE_PROFILES.svg` keeps ordinary SVG drawing elements and attributes.
 * - `svgFilters` permits common visual effects used by card templates.
 * - Executable tags and embedding tags are forbidden.
 * - Inline event handlers are explicitly forbidden even if a browser would otherwise accept them.
 */
const DOMPURIFY_SVG_CONFIG: DOMPurifyConfig = {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'object', 'embed', 'use'],
    FORBID_ATTR: [
        'onload',
        'onclick',
        'onerror',
        'onmouseover',
        'onmouseout',
        'onmousemove',
        'onfocus',
        'onblur',
        'onchange',
        'onsubmit',
        'onkeydown',
        'onkeyup',
        'onkeypress',
        'onpointerdown',
        'onpointerup',
        'onpointermove',
    ],
};

/**
 * Full renderMethod pipeline for svg-mustache:
 * load template → build render data → Mustache hydrate → DOMPurify sanitize
 *
 * Template loading:
 * - `data:` URIs are decoded locally without a network request. URI-encoded payloads use
 *   `decodeURIComponent`; base64 payloads (`;base64` in the MIME prefix) use `atob`.
 * - Other templates are fetched from their URL with a 5-second timeout. A non-2xx response throws
 *   so callers can fall back to the default card UI.
 *
 * Data loading:
 * - The Mustache context is produced by `buildRenderData` from `@learncard/render-method-plugin`.
 *   When `renderProperty` is set, its JSON Pointers are overlaid; otherwise the full credential
 *   context is provided (`vc`, `credential`, `credentialSubjects` aliases).
 *
 * Security:
 * Mustache escapes normal `{{value}}` insertions, but templates may use triple braces or place
 * values in SVG attributes. DOMPurify runs after interpolation so the final markup is sanitized.
 */
export async function renderSvgMustache(
    vc: VC,
    renderMethod: TemplateRenderMethod
): Promise<string> {
    const { template, renderProperty } = renderMethod as unknown as {
        template: string;
        renderProperty?: string[];
        outputPreference?: { mediaType: string };
    };

    let svgTemplate: string;

    if (template.startsWith('data:')) {
        const commaIdx = template.indexOf(',');
        const meta = template.slice(0, commaIdx);
        const payload = template.slice(commaIdx + 1);
        svgTemplate = meta.endsWith(';base64') ? atob(payload) : decodeURIComponent(payload);
    } else {
        const response = await fetch(template, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) {
            throw new Error(
                `Failed to fetch SVG template: ${response.status} ${response.statusText}`
            );
        }
        svgTemplate = await response.text();
    }

    const renderData = buildRenderData(vc, renderProperty);
    const hydratedSvg = Mustache.render(svgTemplate, renderData);

    return DOMPurify.sanitize(hydratedSvg, { ...DOMPURIFY_SVG_CONFIG });
}
