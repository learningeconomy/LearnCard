import Mustache from 'mustache';
import DOMPurify, { type Config as DOMPurifyConfig } from 'dompurify';

import { VC, TemplateRenderMethod, RenderMethodValidator } from '@learncard/types';

type JsonRecord = Record<string, unknown>;
export type RenderMethodData = JsonRecord;

/**
 * Resolves a JSON Pointer (RFC 6901) against an object.
 *
 * Why this exists:
 * The W3C `renderMethod.renderProperty` field lets a credential tell renderers which pieces of
 * data a template needs. Those paths are JSON Pointers, not dot paths, so we need RFC 6901
 * unescaping for property names that contain `/` or `~`.
 *
 * How it works:
 * 1. `""` and `"/"` intentionally return the whole object for broad render contexts.
 * 2. A leading slash is removed, then the pointer is split on `/`.
 * 3. RFC 6901 escapes are reversed: `~1` becomes `/`, `~0` becomes `~`.
 * 4. Each segment is read in order. Missing or non-object parents return `undefined`.
 *
 * Example test data:
 *
 * ```ts
 * const vc = {
 *     issuer: { name: 'Example College' },
 *     credentialSubject: {
 *         name: 'Ada Lovelace',
 *         'skills/path': 'Math',
 *         'literal~tilde': true,
 *     },
 * };
 *
 * resolvePointer(vc, '/issuer/name'); // "Example College"
 * resolvePointer(vc, '/credentialSubject/skills~1path'); // "Math"
 * resolvePointer(vc, '/credentialSubject/literal~0tilde'); // true
 * resolvePointer(vc, '/credentialSubject/missing'); // undefined
 * ```
 */
const resolvePointer = (obj: unknown, pointer: string): unknown => {
    if (!pointer || pointer === '/') return obj;
    const parts = pointer
        .replace(/^\//, '')
        .split('/')
        .map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'));

    let current: unknown = obj;
    for (const part of parts) {
        if (current === null || current === undefined || typeof current !== 'object')
            return undefined;
        current = (current as Record<string, unknown>)[part];
    }
    return current;
};

/**
 * Builds a nested object from a list of JSON Pointers + their resolved values.
 *
 * Why this exists:
 * Mustache templates expect normal nested objects such as `{{issuer.name}}`, while
 * `renderProperty` uses JSON Pointers such as `/issuer/name`. This helper bridges those two
 * shapes by copying only the requested values into a template-friendly object.
 *
 * How it works:
 * Each pointer is resolved against the supplied credential. When the value exists, the same
 * pointer path is recreated in `result`. Missing values are skipped so Mustache renders them as
 * empty strings instead of receiving explicit `undefined` fields.
 *
 * Example test data:
 *
 * ```ts
 * const vc = {
 *     issuer: { name: 'Example College' },
 *     validFrom: '2026-01-15T00:00:00Z',
 *     credentialSubject: { name: 'Ada Lovelace' },
 * } as VC;
 *
 * buildRenderDataFromPointers(vc, [
 *     '/issuer/name',
 *     '/credentialSubject/name',
 *     '/validFrom',
 * ]);
 * {
 *     issuer: { name: 'Example College' },
 *     credentialSubject: { name: 'Ada Lovelace' },
 *     validFrom: '2026-01-15T00:00:00Z',
 * }
 * ```
 */
const buildRenderDataFromPointers = (vc: VC, pointers: string[]): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    for (const pointer of pointers) {
        const value = resolvePointer(vc, pointer);
        if (value === undefined) continue;

        const parts = pointer
            .replace(/^\//, '')
            .split('/')
            .map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'));

        let current = result;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part] || typeof current[part] !== 'object') {
                current[part] = {};
            }
            current = current[part] as Record<string, unknown>;
        }
        current[parts[parts.length - 1]] = value;
    }

    return result;
};

/**
 * Builds a portable Mustache context from the top-level OBv3 credential.
 *
 * Why this exists:
 * SVG Mustache templates have been authored against a few different data shapes over time. Some
 * expect direct VC paths like `{{credentialSubject.name}}`; others expect aliases such as
 * `{{credential.credentialSubject.name}}` or `{{vc.issuer.name}}`. This context supports those
 * shapes while keeping the top-level credential as the single source of truth.
 *
 * Placement contract:
 * `renderMethod` belongs on the top-level OBv3 credential wrapper. This helper intentionally does
 * not inspect or select `boostCredential.renderMethod`.
 *
 * How it works:
 * - Spreads the top-level credential at the top level.
 * - Adds `vc` and `credential` as aliases for the top-level credential.
 * - Adds `credentialSubjects` so templates can iterate with Mustache sections even when the VC
 *   uses a single `credentialSubject` object.
 *
 * Example test data:
 *
 * ```ts
 * const vc = {
 *     issuer: { name: 'Example College' },
 *     credentialSubject: { name: 'Ada Lovelace' },
 * } as VC;
 *
 * const data = buildRenderData(vc);
 * Mustache.render('{{issuer.name}} awarded {{credentialSubject.name}}', data);
 *  "Example College awarded Ada Lovelace"
 *
 * Mustache.render('{{#credentialSubjects}}{{name}}{{/credentialSubjects}}', data);
 *  "Ada Lovelace"
 * ```
 */
export function buildRenderData(vc: VC): RenderMethodData {
    const credential = vc as unknown as JsonRecord;

    return {
        ...credential,
        vc: credential,
        credential,
        credentialSubjects: Array.isArray(credential.credentialSubject)
            ? credential.credentialSubject
            : [credential.credentialSubject].filter(Boolean),
    };
}

/**
 * Builds render data when a render method declares `renderProperty`.
 *
 * Why this exists:
 * `renderProperty` is meant to identify the top-level OBv3 credential fields needed by a template.
 * This helper preserves the same context shape as `buildRenderData` while overlaying the requested
 * pointer-derived values from the credential.
 *
 * Merge order:
 * 1. Start with the full context from `buildRenderData`.
 * 2. Overlay pointer-derived values from the top-level VC.
 * 3. Re-apply the `credential` alias so it keeps its documented meaning.
 *
 * Example test data:
 *
 * ```ts
 * const wrapped = {
 *     issuer: { name: 'Wrapper Issuer' },
 *     credentialSubject: { name: 'Ada Lovelace' },
 *     renderMethod,
 * } as unknown as VC;
 *
 * const data = buildRenderDataForProperties(wrapped, [
 *     '/issuer/name',
 *     '/credentialSubject/name',
 * ]);
 *
 * data.issuer; // { name: 'Wrapper Issuer' }
 * data.credential; // same top-level wrapper VC
 * ```
 */
function buildRenderDataForProperties(vc: VC, pointers: string[]): JsonRecord {
    const credential = vc as unknown as JsonRecord;
    const fromRoot = buildRenderDataFromPointers(vc, pointers);

    return {
        ...buildRenderData(vc),
        ...fromRoot,
        credential,
    };
}

/**
 * Normalizes renderMethod (object or array) and returns the first svg-mustache entry,
 * or null if none found.
 *
 * Why this exists:
 * VCs can store `renderMethod` as a single object or an array. Preview components only need the
 * first supported `TemplateRenderMethod` that this app can render. The render method is expected
 * on the top-level OBv3 credential wrapper, not the nested `boostCredential`.
 *
 * How it works:
 * - Looks at `vc.renderMethod`.
 * - Treats a single object and an array with the same iteration path.
 * - Validates each candidate with `RenderMethodValidator` before trusting its shape.
 * - Returns only `TemplateRenderMethod` entries using the supported `svg-mustache` suite.
 *
 * Example test data:
 *
 * ```ts
 * const vc = {
 *     renderMethod: [
 *         { type: 'OtherRenderMethod', renderSuite: 'png' },
 *         {
 *             type: 'TemplateRenderMethod',
 *             renderSuite: 'svg-mustache',
 *             template: 'data:image/svg+xml,%3Csvg%3E{{name}}%3C/svg%3E',
 *         },
 *     ],
 * } as unknown as VC;
 *
 * getSvgMustacheRenderMethod(vc)?.renderSuite; // "svg-mustache"
 * getSvgMustacheRenderMethod({} as VC); // null
 * ```
 */
export function getSvgMustacheRenderMethod(vc: VC): TemplateRenderMethod | null {
    const root = vc as Record<string, unknown>;
    const raw = root.renderMethod;
    if (!raw) return null;

    const entries = Array.isArray(raw) ? raw : [raw];
    for (const entry of entries) {
        const parsed = RenderMethodValidator.safeParse(entry);
        if (
            parsed.success &&
            parsed.data &&
            'type' in parsed.data &&
            parsed.data.type === 'TemplateRenderMethod' &&
            'renderSuite' in parsed.data &&
            parsed.data.renderSuite === 'svg-mustache'
        ) {
            return parsed.data as TemplateRenderMethod;
        }
    }
    return null;
}

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
 *
 * Example unsafe template result:
 *
 * ```html
 * <svg><script>alert(1)</script><text onload="alert(1)">Ada</text></svg>
 * ```
 *
 * After sanitization, executable content is stripped before React inserts the SVG.
 */
const DOMPURIFY_SVG_CONFIG: DOMPurifyConfig = {
    USE_PROFILES: { svg: true, svgFilters: true },
    // Block elements that could execute code or load external content unsafely
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
 * Why this exists:
 * `RenderMethodDisplay` needs a single safe function that turns a VC plus a
 * `TemplateRenderMethod` into sanitized SVG markup. This helper owns every step that can fail or
 * affect safety: template loading, data shaping, interpolation, and sanitization.
 *
 * Template loading:
 * - `data:image/svg+xml,...` templates are decoded locally. This is what
 *   `buildTemplateRenderMethod({ templateValue })` creates.
 * - Other templates are fetched from their URL. A non-2xx response throws so callers can fall back
 *   to the default card UI.
 *
 * Data loading:
 * - When `renderProperty` is present, those JSON Pointers are expanded from the top-level VC.
 * - Without `renderProperty`, the full portable context from `buildRenderData` is provided.
 *
 * Security:
 * Mustache escapes normal `{{value}}` insertions, but templates may use triple braces or place
 * values in SVG attributes. DOMPurify runs after interpolation so the final markup is sanitized.
 *
 * Example test data:
 *
 * ```ts
 * const vc = {
 *     issuer: { name: 'Example College' },
 *     credentialSubject: { name: 'Ada Lovelace' },
 * } as VC;
 *
 * const renderMethod = {
 *     type: 'TemplateRenderMethod',
 *     renderSuite: 'svg-mustache',
 *     template: `data:image/svg+xml,${encodeURIComponent(
 *         '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.name}}</text></svg>'
 *     )}`,
 *     renderProperty: ['/credentialSubject/name'],
 *     outputPreference: { mediaType: 'image/svg+xml' },
 * } as TemplateRenderMethod;
 *
 * await renderSvgMustache(vc, renderMethod);
 * '<svg xmlns="http://www.w3.org/2000/svg"><text>Ada Lovelace</text></svg>'
 * ```
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
        const [, encoded] = template.split(',');
        svgTemplate = decodeURIComponent(encoded);
    } else {
        const response = await fetch(template);
        if (!response.ok) {
            throw new Error(
                `Failed to fetch SVG template: ${response.status} ${response.statusText}`
            );
        }
        svgTemplate = await response.text();
    }

    const renderData =
        renderProperty && renderProperty.length > 0
            ? buildRenderDataForProperties(vc, renderProperty)
            : buildRenderData(vc);

    const hydratedSvg = Mustache.render(svgTemplate, renderData);

    const sanitized = DOMPurify.sanitize(hydratedSvg, { ...DOMPURIFY_SVG_CONFIG });

    return sanitized;
}
