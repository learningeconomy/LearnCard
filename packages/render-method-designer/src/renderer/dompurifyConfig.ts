import type { Config as DOMPurifyConfig } from 'dompurify';

/**
 * DOMPurify policy for SVG output rendered from credential data.
 *
 * Mirrors the config in `apps/learn-card-app/src/helpers/renderMethod.helpers.ts`. Exported so
 * the app helper and any other consumer can converge on a single policy as part of a follow-up
 * migration.
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
export const DOMPURIFY_SVG_CONFIG: DOMPurifyConfig = {
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
