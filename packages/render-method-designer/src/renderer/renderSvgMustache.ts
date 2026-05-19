import Mustache from 'mustache';
import DOMPurify from 'dompurify';

import { DOMPURIFY_SVG_CONFIG } from './dompurifyConfig';
import type { RenderData } from '../types';

/**
 * Hydrate an SVG Mustache template against the given data, then sanitize the result using the
 * shared `DOMPURIFY_SVG_CONFIG`. Returns the sanitized SVG markup as a string suitable for
 * `dangerouslySetInnerHTML`.
 *
 * Synchronous because templates inside the designer are always inline strings — the network
 * fetch branch in `apps/learn-card-app/src/helpers/renderMethod.helpers.ts:renderSvgMustache`
 * exists for `templateId` URLs, which the designer doesn't deal with.
 *
 * Why DOMPurify runs after Mustache and not before:
 * Mustache escapes normal `{{value}}` insertions, but templates use triple braces or place
 * values into SVG attributes. Sanitizing the hydrated output is the correct boundary — anything
 * an attacker could inject via credential data is neutralized by DOMPurify's SVG profile.
 */
export const renderSvgMustache = (template: string, data: RenderData): string => {
    const hydrated = Mustache.render(template, data);
    return DOMPurify.sanitize(hydrated, { ...DOMPURIFY_SVG_CONFIG }) as unknown as string;
};
