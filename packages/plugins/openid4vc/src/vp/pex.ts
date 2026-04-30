import safeRegex from 'safe-regex';
import { Constraints, Field, InputDescriptor } from './types';

/**
 * Upper bound on the length of a JSONSchema `pattern` string we'll
 * compile and execute from a verifier-supplied filter. Real-world PEX
 * patterns are short (tens of characters); 512 is generous for any
 * legitimate use while ruling out adversarial oversized payloads that
 * could stress `safe-regex` or the regex engine itself.
 */
const MAX_PEX_PATTERN_LENGTH = 512;

/**
 * Presentation Exchange v2 matcher — tests whether a single candidate VC
 * satisfies an input_descriptor's constraints.
 *
 * Scope (what PEX expressions we support in Slice 6):
 *
 * **JSONPath subset (field.path[])**
 * - `$`                       root
 * - `$.foo`, `$.foo.bar`      dotted properties
 * - `$['foo']`, `$["foo bar"]` bracketed property names (quoted literals)
 * - `$.foo[0]`                numeric index
 * - `$.foo[*]`                array wildcard
 * - `$..foo`                  recursive descent
 * - `$.foo[?(@.bar=='x')]`    filter predicates — NOT yet supported, and
 *                              they're rare in real-world PD docs. Paths
 *                              that need predicates throw a descriptive
 *                              error rather than silently evaluating to
 *                              nothing.
 *
 * **JSON Schema filter subset (field.filter)**
 * - `type`, `const`, `enum`, `pattern`
 * - `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`
 * - `minLength`, `maxLength`
 * - `contains` (on arrays)
 * - `items` (on arrays — applied to every element)
 * - Anything else is treated as "unknown constraint" and passes by
 *   default. Verifiers relying on more exotic keywords will want the
 *   full-ajv upgrade path noted in the README.
 *
 * Format / holder-binding checks live in the higher-level select.ts
 * layer (Slice 6d) since they depend on knowing the candidate's format
 * and the PD's `format` designation together.
 */

/** Per-field evaluation result. */
export interface FieldMatch {
    matched: boolean;
    /** First JSONPath from `field.path[]` that yielded a matching value. */
    matchedPath?: string;
    /** The value at `matchedPath`. */
    value?: unknown;
    /** Diagnostic reason when `matched === false`. */
    reason?: string;
}

/** Per-descriptor evaluation result. */
export interface DescriptorMatch {
    matched: boolean;
    descriptorId: string;
    /** One entry per declared field, in order. */
    fields: FieldMatch[];
    /** Diagnostic reason summarizing the first failure, when `matched === false`. */
    reason?: string;
}

/**
 * Evaluate a single PEX field against a candidate credential.
 *
 * Walks `field.path[]` in declared order, returning the first path that
 * resolves AND — if `field.filter` is present — whose value satisfies
 * the filter. Optional fields that find no value still succeed.
 */
export const evaluateField = (candidate: unknown, field: Field): FieldMatch => {
    if (!Array.isArray(field.path) || field.path.length === 0) {
        return {
            matched: false,
            reason: 'Field has no `path[]` declared',
        };
    }

    for (const path of field.path) {
        let values: unknown[];

        try {
            values = queryJsonPath(candidate, path);
        } catch (e) {
            return {
                matched: false,
                reason: `JSONPath \"${path}\" could not be evaluated: ${describe(e)}`,
            };
        }

        if (values.length === 0) continue;

        // PEX semantics: iterate matches and keep the first that passes
        // the filter. Without a filter, the first non-empty match wins.
        for (const value of values) {
            if (!field.filter) return { matched: true, matchedPath: path, value };

            if (satisfiesFilter(value, field.filter)) {
                return { matched: true, matchedPath: path, value };
            }

            // Array-element fallback: if the JSONPath landed on a JSON
            // array but the filter expects a primitive (e.g. `type:
            // "string"` + `pattern`), try each element individually.
            // This is what Sphereon PEX / Credo-TS do in practice and is
            // the only way walt.id's real-world PDs (`path: ["$.vc.type"]`
            // + `filter: {type: "string", pattern: "..."}`) can match a
            // VCDM `type` array. Filters that explicitly want an array
            // (`type: "array"`, `minItems`, `contains`) already succeed
            // on the earlier direct application so they never reach this
            // branch.
            if (Array.isArray(value) && expectsPrimitive(field.filter)) {
                for (const element of value) {
                    if (satisfiesFilter(element, field.filter)) {
                        return { matched: true, matchedPath: path, value: element };
                    }
                }
            }
        }
    }

    if (field.optional) {
        return { matched: true, reason: 'Field is optional and yielded no value' };
    }

    return {
        matched: false,
        reason: field.filter
            ? `No value from paths ${JSON.stringify(field.path)} satisfied the filter`
            : `None of paths ${JSON.stringify(field.path)} resolved on the candidate`,
    };
};

/**
 * Evaluate a full input_descriptor against a candidate credential.
 *
 * Short-circuits on the first required-field failure so a single bad
 * field produces a useful reason instead of a wall of mismatches.
 */
export const matchInputDescriptor = (
    candidate: unknown,
    descriptor: InputDescriptor
): DescriptorMatch => {
    const constraints: Constraints | undefined = descriptor.constraints;
    const fields: Field[] = constraints?.fields ?? [];

    const results: FieldMatch[] = [];

    for (const field of fields) {
        const result = evaluateField(candidate, field);
        results.push(result);

        if (!result.matched) {
            return {
                matched: false,
                descriptorId: descriptor.id,
                fields: results,
                reason: result.reason,
            };
        }
    }

    return {
        matched: true,
        descriptorId: descriptor.id,
        fields: results,
    };
};

/* -------------------------------------------------------------------------- */
/*                           JSONPath subset evaluator                        */
/* -------------------------------------------------------------------------- */

type Segment =
    | { kind: 'property'; name: string }
    | { kind: 'index'; index: number }
    | { kind: 'wildcard' }
    | { kind: 'descendant'; name: string };

/**
 * Evaluate a supported JSONPath expression against `root` and return all
 * matching values. Throws if the expression uses unsupported features
 * (filter predicates, slicing, unions, scripting) so callers surface an
 * actionable error rather than silently returning nothing.
 */
export const queryJsonPath = (root: unknown, path: string): unknown[] => {
    if (typeof path !== 'string' || path.length === 0) {
        throw new Error('JSONPath must be a non-empty string');
    }

    if (path !== '$' && !path.startsWith('$')) {
        throw new Error(`JSONPath \"${path}\" must start with \"$\"`);
    }

    // Reject features we don't support so nothing matches "by accident".
    if (/\[\?\(/.test(path)) {
        throw new Error(
            `JSONPath filter expressions are not supported yet (found in \"${path}\")`
        );
    }
    if (/\[\s*\d+\s*:/.test(path) || /\[\s*:\s*\d+\s*\]/.test(path)) {
        throw new Error(`JSONPath array slicing is not supported yet (found in \"${path}\")`);
    }

    const segments = tokenizeJsonPath(path);

    let current: unknown[] = [root];

    for (const segment of segments) {
        const next: unknown[] = [];

        for (const value of current) {
            switch (segment.kind) {
                case 'property': {
                    const child = getProperty(value, segment.name);
                    if (child !== undefined) next.push(child);
                    break;
                }
                case 'index': {
                    if (Array.isArray(value) && segment.index < value.length) {
                        next.push(value[segment.index]);
                    }
                    break;
                }
                case 'wildcard': {
                    if (Array.isArray(value)) {
                        for (const item of value) next.push(item);
                    } else if (value && typeof value === 'object') {
                        for (const item of Object.values(value)) next.push(item);
                    }
                    break;
                }
                case 'descendant': {
                    collectDescendants(value, segment.name, next);
                    break;
                }
            }
        }

        current = next;
    }

    return current;
};

const getProperty = (value: unknown, name: string): unknown => {
    if (value === null || value === undefined) return undefined;

    if (Array.isArray(value)) {
        // Arrays expose a handful of host properties (length, etc.). We
        // deliberately ignore those — PEX paths should target JSON content.
        return undefined;
    }

    if (typeof value === 'object') {
        return (value as Record<string, unknown>)[name];
    }

    return undefined;
};

const collectDescendants = (value: unknown, name: string, out: unknown[]): void => {
    if (value === null || value === undefined) return;

    if (Array.isArray(value)) {
        for (const item of value) collectDescendants(item, name, out);
        return;
    }

    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;

        for (const [key, child] of Object.entries(obj)) {
            if (key === name) out.push(child);
            collectDescendants(child, name, out);
        }
    }
};

/**
 * Tokenize a supported JSONPath expression into segments. Handles
 * bracket-quoted property names (`$['foo bar']`), wildcards, indices,
 * and recursive descent.
 */
const tokenizeJsonPath = (path: string): Segment[] => {
    const segments: Segment[] = [];

    // Strip the leading `$` and normalize trailing chars.
    let i = path.startsWith('$') ? 1 : 0;

    while (i < path.length) {
        const c = path[i];

        if (c === '.') {
            // `..name` — recursive descent. Must be followed by a name
            // (we don't support `..[...]` wildcard-descent in Slice 6).
            if (path[i + 1] === '.') {
                i += 2;
                const name = readIdentifier(path, i);
                if (!name.text) {
                    throw new Error(
                        `Recursive descent \"..\" at position ${i} must be followed by a property name`
                    );
                }
                segments.push({ kind: 'descendant', name: name.text });
                i = name.next;
            } else {
                // `.name` or `.*` — both plain property references.
                i += 1;

                if (path[i] === '*') {
                    segments.push({ kind: 'wildcard' });
                    i += 1;
                    continue;
                }

                const name = readIdentifier(path, i);
                if (!name.text) {
                    throw new Error(
                        `Property accessor \".\" at position ${i} must be followed by an identifier`
                    );
                }
                segments.push({ kind: 'property', name: name.text });
                i = name.next;
            }
        } else if (c === '[') {
            const end = path.indexOf(']', i + 1);
            if (end === -1) {
                throw new Error(`Unterminated \"[\" in JSONPath \"${path}\"`);
            }

            const inner = path.slice(i + 1, end).trim();

            if (inner === '*') {
                segments.push({ kind: 'wildcard' });
            } else if (/^-?\d+$/.test(inner)) {
                segments.push({ kind: 'index', index: parseInt(inner, 10) });
            } else if (/^'[^']*'$/.test(inner) || /^"[^"]*"$/.test(inner)) {
                segments.push({ kind: 'property', name: inner.slice(1, -1) });
            } else {
                throw new Error(`Unsupported bracket expression [${inner}] in JSONPath \"${path}\"`);
            }

            i = end + 1;
        } else {
            throw new Error(
                `Unexpected character \"${c}\" at position ${i} in JSONPath \"${path}\"`
            );
        }
    }

    return segments;
};

/**
 * Read a contiguous run of identifier-safe characters starting at `start`.
 * Identifiers may include letters, digits, underscores, hyphens, `@` and
 * `:` so we accept `@context`, `https://` in claim names, etc.
 */
const readIdentifier = (path: string, start: number): { text: string; next: number } => {
    let i = start;
    while (i < path.length) {
        const c = path[i];
        const isId = /[A-Za-z0-9_\-@:]/.test(c);
        if (!isId) break;
        i += 1;
    }
    return { text: path.slice(start, i), next: i };
};

/* -------------------------------------------------------------------------- */
/*                     JSON Schema filter subset evaluator                    */
/* -------------------------------------------------------------------------- */

/**
 * Return whether `value` satisfies the PEX-sanctioned subset of JSON
 * Schema. Unknown keywords are ignored (lenient mode) — wallets that
 * reject on unknown keywords force verifier upgrades in lockstep, which
 * is incompatible with the "meet them where they are" design goal.
 */
export const satisfiesFilter = (value: unknown, filter: Record<string, unknown>): boolean => {
    // `type` — may be a single JSON type name or an array of them.
    if ('type' in filter) {
        const types = Array.isArray(filter.type) ? filter.type : [filter.type];
        const matched = types.some(t => matchesType(value, t));
        if (!matched) return false;
    }

    if ('const' in filter && !deepEqual(value, filter.const)) return false;

    if ('enum' in filter) {
        const enumValues = filter.enum;
        if (!Array.isArray(enumValues)) return false;
        if (!enumValues.some(candidate => deepEqual(value, candidate))) return false;
    }

    if ('pattern' in filter) {
        if (typeof value !== 'string') return false;
        const pattern = filter.pattern;
        if (typeof pattern !== 'string') return false;

        // Reject adversarial verifier patterns before handing bytes to
        // the regex engine. Real-world PEX patterns are tiny (mDL field
        // shapes, ISO dates, email prefixes) — anything over 512 chars
        // is either a bug on the verifier side or a ReDoS probe, so we
        // treat oversized patterns as a non-match. This bounds the
        // worst-case work `safe-regex` and `new RegExp` can do before
        // either detects trouble.
        if (pattern.length > MAX_PEX_PATTERN_LENGTH) return false;

        // `safe-regex` rejects star-height >= 2 regexes (the usual
        // ReDoS shape). Combined with the length cap above it catches
        // essentially every ReDoS pattern we've seen in the wild.
        if (!safeRegex(pattern)) return false;

        let re: RegExp;
        try {
            re = new RegExp(pattern);
        } catch {
            return false;
        }

        // Even with `safe-regex` passing, some pathological patterns
        // (deep alternation, lookaround recursion) can throw
        // `RangeError` / overflow during execution. Fail the descriptor
        // rather than crashing the whole selection pass.
        try {
            if (!re.test(value)) return false;
        } catch {
            return false;
        }
    }

    // Numeric bounds — only apply when the value is a number. Non-numbers
    // are left alone; the `type` keyword is what rejects them.
    if (typeof value === 'number') {
        if (typeof filter.minimum === 'number' && value < filter.minimum) return false;
        if (typeof filter.maximum === 'number' && value > filter.maximum) return false;
        if (
            typeof filter.exclusiveMinimum === 'number' &&
            value <= filter.exclusiveMinimum
        ) {
            return false;
        }
        if (
            typeof filter.exclusiveMaximum === 'number' &&
            value >= filter.exclusiveMaximum
        ) {
            return false;
        }
    }

    // String length — char-count semantics (good enough for PEX use cases).
    if (typeof value === 'string') {
        if (typeof filter.minLength === 'number' && value.length < filter.minLength) {
            return false;
        }
        if (typeof filter.maxLength === 'number' && value.length > filter.maxLength) {
            return false;
        }
    }

    // Array keywords.
    if (Array.isArray(value)) {
        if (filter.contains && typeof filter.contains === 'object') {
            const containsFilter = filter.contains as Record<string, unknown>;
            const ok = value.some(item => satisfiesFilter(item, containsFilter));
            if (!ok) return false;
        }

        if (filter.items && typeof filter.items === 'object' && !Array.isArray(filter.items)) {
            const itemsFilter = filter.items as Record<string, unknown>;
            const ok = value.every(item => satisfiesFilter(item, itemsFilter));
            if (!ok) return false;
        }

        if (typeof filter.minItems === 'number' && value.length < filter.minItems) {
            return false;
        }
        if (typeof filter.maxItems === 'number' && value.length > filter.maxItems) {
            return false;
        }
    }

    return true;
};

/**
 * True when a filter unambiguously targets a primitive (string / number
 * / integer / boolean / null). Used by `evaluateField` to decide whether
 * an array JSONPath match should be retried element-by-element.
 *
 * We treat a filter as primitive-targeting when:
 *
 * - It declares `type` and every listed type is a primitive, **or**
 * - It has no `type` keyword but carries a keyword that only makes
 *   sense on primitives: `pattern` / `minLength` / `maxLength` (string),
 *   `minimum` / `maximum` / `exclusiveMinimum` / `exclusiveMaximum`
 *   (number), or `const` / `enum` whose value(s) are themselves
 *   primitive.
 *
 * A filter with any array-shape keyword (`contains`, `items`,
 * `minItems`, `maxItems`, or `type: "array"` / `type: "object"`) is
 * always treated as non-primitive so `{contains: {const: "X"}}` against
 * an array that lacks `"X"` stays a hard miss instead of being rescued
 * by element iteration.
 *
 * This mirrors what Sphereon PEX and Credo-TS do in practice and is
 * what lets real-world PDs that write `{const: "AlpsTourReservation"}`
 * or `{pattern: "..."}` without a `type` keyword match against
 * JSON-LD `type` arrays.
 */
const expectsPrimitive = (filter: Record<string, unknown>): boolean => {
    // Array-structural keywords never imply primitives — bail early so
    // the evaluator never flattens what a verifier wants as an array.
    if (hasAnyKeyword(filter, ['contains', 'items', 'minItems', 'maxItems'])) {
        return false;
    }

    if ('type' in filter) {
        const types = Array.isArray(filter.type) ? filter.type : [filter.type];
        if (types.length === 0) return false;
        return types.every(t => typeof t === 'string' && PRIMITIVE_TYPES.has(t));
    }

    // Type-less filter: infer from the other keywords.
    if (hasAnyKeyword(filter, [
        'pattern',
        'minLength',
        'maxLength',
        'minimum',
        'maximum',
        'exclusiveMinimum',
        'exclusiveMaximum',
    ])) {
        return true;
    }

    if ('const' in filter && isPrimitiveValue(filter.const)) return true;

    if ('enum' in filter && Array.isArray(filter.enum) && filter.enum.length > 0) {
        return filter.enum.every(isPrimitiveValue);
    }

    return false;
};

const PRIMITIVE_TYPES = new Set(['string', 'number', 'integer', 'boolean', 'null']);

const isPrimitiveValue = (value: unknown): boolean =>
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean';

const hasAnyKeyword = (filter: Record<string, unknown>, keywords: string[]): boolean =>
    keywords.some(k => k in filter);

const matchesType = (value: unknown, type: unknown): boolean => {
    switch (type) {
        case 'string':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number';
        case 'integer':
            return typeof value === 'number' && Number.isInteger(value);
        case 'boolean':
            return typeof value === 'boolean';
        case 'null':
            return value === null;
        case 'array':
            return Array.isArray(value);
        case 'object':
            return value !== null && typeof value === 'object' && !Array.isArray(value);
        default:
            return false;
    }
};

/**
 * Minimal deep-equal for `const` / `enum` comparisons. Handles primitives,
 * arrays, and plain objects — enough for any JSON value.
 */
const deepEqual = (a: unknown, b: unknown): boolean => {
    if (a === b) return true;
    if (a === null || b === null) return a === b;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
    }

    if (typeof a === 'object') {
        if (typeof b !== 'object' || Array.isArray(b)) return false;
        const ao = a as Record<string, unknown>;
        const bo = b as Record<string, unknown>;
        const ak = Object.keys(ao);
        const bk = Object.keys(bo);
        if (ak.length !== bk.length) return false;
        for (const k of ak) {
            if (!deepEqual(ao[k], bo[k])) return false;
        }
        return true;
    }

    return false;
};

const describe = (e: unknown): string => (e instanceof Error ? e.message : String(e));
