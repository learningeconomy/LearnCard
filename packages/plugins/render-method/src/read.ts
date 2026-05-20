import { unwrapBoostCredential } from '@learncard/helpers';
import {
    UnsignedVC,
    VC,
    RenderMethod,
    TemplateRenderMethod,
    TemplateRenderMethodValidator,
} from '@learncard/types';

import { buildRenderValues, type RenderValuesOptions } from './format-aliases';

type AnyCredential = VC | UnsignedVC;
type JsonRecord = Record<string, unknown>;

/** Mustache context shape produced by `buildRenderData`. */
export type RenderMethodData = JsonRecord;

/**
 * Type guard for any `TemplateRenderMethod` (Zod-validated). Use for shape
 * checks before treating an unknown `renderMethod` entry as a template render.
 */
export const isTemplateRenderMethod = (rm: unknown): rm is TemplateRenderMethod =>
    TemplateRenderMethodValidator.safeParse(rm).success;

/**
 * Type guard for `TemplateRenderMethod` with `renderSuite === 'svg-mustache'`.
 * Exported so consumers can compose their own selection (e.g., capability
 * negotiation across multiple suites the renderer supports).
 */
export const isSvgMustacheRenderMethod = (rm: unknown): rm is TemplateRenderMethod => {
    const parsed = TemplateRenderMethodValidator.safeParse(rm);
    return parsed.success && parsed.data.renderSuite === 'svg-mustache';
};

/**
 * Returns all `renderMethod` entries on a VC. Normalizes single-object form to
 * an array and unwraps `CertifiedBoostCredential` so callers don't have to
 * think about the wrapping layer.
 *
 * Entries are NOT validated here. Callers apply type guards via
 * `findRenderMethod` / `findRenderMethods`, or one of the typed conveniences.
 */
export const getRenderMethods = (vc: AnyCredential): RenderMethod[] => {
    const effective = (unwrapBoostCredential(vc) ?? vc) as
        | Record<string, unknown>
        | undefined;
    const raw = effective?.renderMethod;
    if (!raw) return [];
    return (Array.isArray(raw) ? raw : [raw]) as RenderMethod[];
};

/**
 * First `renderMethod` matching a type-guard predicate, or `null` if none.
 *
 * The predicate receives raw entries so it can apply Zod-validated guards
 * (e.g., `isSvgMustacheRenderMethod`). The return type is narrowed by the
 * predicate.
 */
export function findRenderMethod<T extends RenderMethod = RenderMethod>(
    vc: AnyCredential,
    predicate: (rm: RenderMethod) => rm is T
): T | null {
    for (const entry of getRenderMethods(vc)) {
        if (predicate(entry)) return entry;
    }
    return null;
}

/** Like `findRenderMethod`, but returns every matching entry. */
export function findRenderMethods<T extends RenderMethod = RenderMethod>(
    vc: AnyCredential,
    predicate: (rm: RenderMethod) => rm is T
): T[] {
    return getRenderMethods(vc).filter(predicate);
}

/**
 * First `TemplateRenderMethod` on a VC whose `renderSuite` matches the given
 * suite name, or `null`. Accepts a single suite string OR an array of suite
 * strings (returns the first match across the list — useful for capability
 * negotiation when a renderer supports multiple suites).
 *
 * Returns the Zod-parsed shape (not the raw entry).
 *
 *     findTemplateRenderMethod(vc, 'svg-mustache')
 *     findTemplateRenderMethod(vc, ['svg-mustache', 'html-mustache'])
 */
export const findTemplateRenderMethod = (
    vc: AnyCredential,
    suite: string | readonly string[]
): TemplateRenderMethod | null => {
    const suites = typeof suite === 'string' ? new Set([suite]) : new Set(suite);
    for (const entry of getRenderMethods(vc)) {
        const parsed = TemplateRenderMethodValidator.safeParse(entry);
        if (parsed.success && suites.has(parsed.data.renderSuite)) {
            return parsed.data;
        }
    }
    return null;
};

/** Like `findTemplateRenderMethod`, but returns every matching entry. */
export const findTemplateRenderMethods = (
    vc: AnyCredential,
    suite: string | readonly string[]
): TemplateRenderMethod[] => {
    const suites = typeof suite === 'string' ? new Set([suite]) : new Set(suite);
    const result: TemplateRenderMethod[] = [];
    for (const entry of getRenderMethods(vc)) {
        const parsed = TemplateRenderMethodValidator.safeParse(entry);
        if (parsed.success && suites.has(parsed.data.renderSuite)) {
            result.push(parsed.data);
        }
    }
    return result;
};

/**
 * Convenience: the first svg-mustache `TemplateRenderMethod` on a VC, or `null`.
 * Equivalent to `findTemplateRenderMethod(vc, 'svg-mustache')`.
 */
export const getSvgMustacheRenderMethod = (
    vc: AnyCredential
): TemplateRenderMethod | null => findTemplateRenderMethod(vc, 'svg-mustache');

/**
 * Prototype-pollution guard. JSON Pointers come from credential data
 * (untrusted), and these three keys are the canonical pollution vectors when
 * a pointer is walked with bracket-indexing.
 */
const isUnsafeKey = (key: string): boolean =>
    key === '__proto__' || key === 'constructor' || key === 'prototype';

const resolvePointer = (obj: unknown, pointer: string): unknown => {
    if (!pointer || pointer === '/') return obj;
    const parts = pointer
        .replace(/^\//, '')
        .split('/')
        .map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'));

    if (parts.some(isUnsafeKey)) return undefined;

    let current: unknown = obj;
    for (const part of parts) {
        if (current === null || current === undefined || typeof current !== 'object')
            return undefined;
        current = (current as Record<string, unknown>)[part];
    }
    return current;
};

const buildRenderDataFromPointers = (
    vc: AnyCredential,
    pointers: string[]
): JsonRecord => {
    const result: JsonRecord = Object.create(null) as JsonRecord;
    const isUnsafeKey = (key: string): boolean =>
        key === '__proto__' || key === 'constructor' || key === 'prototype';

    for (const pointer of pointers) {
        const value = resolvePointer(vc, pointer);
        if (value === undefined) continue;

        const parts = pointer
            .replace(/^\//, '')
            .split('/')
            .map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'));

        if (parts.some(isUnsafeKey)) continue;

        let current = result;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part] || typeof current[part] !== 'object') {
                current[part] = Object.create(null) as JsonRecord;
            }
            current = current[part] as JsonRecord;
        }

        const lastPart = parts[parts.length - 1];
        if (isUnsafeKey(lastPart)) continue;
        current[lastPart] = value;
    }

    return result;
};

/**
 * Builds the portable Mustache context for a VC. Designed for SVG / HTML /
 * text Mustache templates that may have been authored against any of these
 * shapes:
 *
 *     {{credentialSubject.name}}                                // direct VC paths
 *     {{credential.credentialSubject.name}}                     // `credential` alias
 *     {{vc.issuer.name}}                                        // `vc` alias
 *     {{#credentialSubjects}}{{name}}{{/credentialSubjects}}    // section over array
 *     {{renderValues.validFrom.formatted.long}}                 // formatted aliases
 *
 * The top-level credential is the single source of truth; aliases keep older
 * templates working. When `renderProperty` (RFC 6901 JSON Pointers) is given,
 * those values are overlaid at their pointer paths in the resulting context.
 *
 * **`renderValues`** is a structural mirror of the credential containing both
 * semantic resolution (`resolved`) and locale-aware formatting (`formatted`).
 * Dates/identifiers land under `.formatted`; image-object-vs-string normalization lands
 * under `.resolved`. See `format-aliases.ts` for the full contract. The mirror is added by
 * default; pass `{ renderValues: false }` in options to opt out (e.g. for fixture
 * snapshot tests where stable output is required).
 *
 * This function does NOT unwrap `CertifiedBoostCredential` — pass the layer
 * you want the template to bind to. `getRenderMethods` is the helper that
 * unwraps.
 */
export interface BuildRenderDataOptions extends RenderValuesOptions {
    /** Disable the `renderValues` mirror. Defaults to `true` (mirror included). */
    renderValues?: boolean;
}

export const buildRenderData = (
    vc: AnyCredential,
    renderProperty?: string[],
    options: BuildRenderDataOptions = {}
): RenderMethodData => {
    const credential = vc as unknown as JsonRecord;
    const base: RenderMethodData = {
        ...credential,
        vc: credential,
        credential,
        credentialSubjects: Array.isArray(credential.credentialSubject)
            ? credential.credentialSubject
            : [credential.credentialSubject].filter(Boolean),
    };

    if (options.renderValues !== false) {
        base.renderValues = buildRenderValues(credential, options);
    }

    if (!renderProperty || renderProperty.length === 0) return base;

    return {
        ...base,
        ...buildRenderDataFromPointers(vc, renderProperty),
        credential,
    };
};
