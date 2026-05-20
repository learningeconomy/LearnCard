import type { RenderData, SampleCredential } from '../types';
import { buildRenderValues } from './format-aliases';

/**
 * Reject keys that would walk into prototype chain. Mirrors the same guard used in
 * `packages/plugins/render-method/src/read.ts` — the variable picker walks credential data
 * that comes from arbitrary fixtures, so the same threat model applies.
 */
const isUnsafeKey = (key: string): boolean =>
    key === '__proto__' || key === 'constructor' || key === 'prototype';

/**
 * Build the Mustache render context for a sample VC. Reproduces the shape of
 * `buildRenderData` from `@learncard/render-method-plugin` so templates authored in the
 * designer behave identically when run through the real plugin: top-level credential plus
 * `vc` / `credential` / `credentialSubjects` aliases.
 *
 * Why we reproduce the shape locally instead of importing the plugin: the designer is a UI
 * component package and should not pull in the plugin's wallet-dependency surface. The
 * shape is small and stable.
 */
export const buildPreviewData = (credential: SampleCredential): RenderData => {
    const credentialRecord = credential as unknown as RenderData;
    const subject = credentialRecord.credentialSubject;
    return {
        ...credentialRecord,
        vc: credentialRecord,
        credential: credentialRecord,
        credentialSubjects: Array.isArray(subject)
            ? subject
            : subject !== undefined && subject !== null
                ? [subject]
                : [],
        renderValues: buildRenderValues(credentialRecord),
    };
};

/**
 * A discovered variable in a sample VC. `path` is the dotted Mustache path (e.g.
 * `credentialSubject.name`); `preview` is a short stringified preview of the value at that
 * path for display in the picker dropdown.
 */
export interface DiscoveredVariable {
    path: string;
    preview: string;
}

const MAX_DEPTH = 6;
const MAX_PREVIEW_LENGTH = 60;

const previewValue = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') {
        const trimmed = value.length > MAX_PREVIEW_LENGTH
            ? `${value.slice(0, MAX_PREVIEW_LENGTH)}…`
            : value;
        return `"${trimmed}"`;
    }
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return `[…${value.length}]`;
    if (typeof value === 'object') return '{…}';
    return String(value);
};

/**
 * Recursively walk a credential and produce a flat list of dotted Mustache paths the user can
 * click to insert into the editor. The walker:
 * - Skips unsafe prototype keys (`__proto__`, `constructor`, `prototype`).
 * - Skips keys that aren't valid Mustache identifiers (anything outside `[a-zA-Z0-9_-]`).
 * - Caps recursion at `MAX_DEPTH` to handle deeply nested CLR structures without OOM.
 * - Includes leaf values only — array indexes and object roots are not inserted directly
 *   (users insert Mustache sections by hand for arrays, which the picker can't generate).
 * - Sorts results by path for stable rendering across reloads.
 */
export const walkVariables = (data: RenderData): DiscoveredVariable[] => {
    const results: DiscoveredVariable[] = [];
    const visit = (value: unknown, path: string[], depth: number): void => {
        if (depth > MAX_DEPTH) return;
        if (value === null || value === undefined) return;
        if (typeof value !== 'object') {
            results.push({ path: path.join('.'), preview: previewValue(value) });
            return;
        }
        if (Array.isArray(value)) {
            // Don't descend into arrays — sections are not auto-pickable.
            results.push({ path: path.join('.'), preview: previewValue(value) });
            return;
        }
        // Plain object: descend.
        for (const key of Object.keys(value)) {
            if (isUnsafeKey(key)) continue;
            if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(key)) continue;
            visit((value as Record<string, unknown>)[key], [...path, key], depth + 1);
        }
    };

    // Walk top-level keys, but skip the aliases produced by `buildPreviewData` — they would
    // dominate the picker with duplicates.
    const SKIP_TOP_LEVEL = new Set(['vc', 'credential', 'credentialSubjects', 'renderValues']);
    for (const key of Object.keys(data)) {
        if (isUnsafeKey(key)) continue;
        if (SKIP_TOP_LEVEL.has(key)) continue;
        if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(key)) continue;
        visit(data[key], [key], 1);
    }

    results.sort((a, b) => a.path.localeCompare(b.path));
    return results;
};
