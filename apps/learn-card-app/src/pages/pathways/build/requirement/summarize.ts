/**
 * Human-readable summary of a `NodeRequirement`.
 *
 * Used by:
 *   - The collapsed "Done when" section summary (via
 *     `requirementSatisfiedSpec.summarize`).
 *   - The `RequirementEditor` header preview, so the author sees the
 *     one-liner that represents their tree without opening every
 *     composite level.
 *   - Future places that surface requirements in lists (outline
 *     rows, proposals, validation banners).
 *
 * ## Design rules
 *
 *   1. **Leaf summaries are terse.** Each leaf gets one compact line
 *      that favours the author's own strings (type name, CTID, URL)
 *      over field labels. No JSON, no schema hints.
 *
 *   2. **Composites read naturally at shallow depth.** One level
 *      deep: "any of: A; B; C". Two levels deep: parens around the
 *      inner group. Beyond two levels we truncate with "\u2026"; the
 *      author can see the full tree in the editor.
 *
 *   3. **Empty placeholders render honestly.** A leaf whose required
 *      field is blank (e.g. a just-picked `credential-type` with no
 *      type yet) summarises as `<credential type>` in angle brackets
 *      so collapsed summaries don't hide an in-flight edit.
 */

import type { NodeRequirement } from '../../types';

const EMPTY = (label: string): string => `\u27E8${label}\u27E9`;

/**
 * Compact summary. Parent callers pass `depth` so deeply-nested
 * composites can truncate \u2014 human reading degrades fast beyond
 * two levels of brackets.
 */
export const summarizeRequirement = (
    requirement: NodeRequirement,
    depth: number = 0,
): string => {
    switch (requirement.kind) {
        case 'credential-type': {
            const type = requirement.type.trim() || EMPTY('credential type');

            return requirement.issuer
                ? `${type} from ${requirement.issuer}`
                : type;
        }

        case 'boost-uri':
            return requirement.uri
                ? `boost ${requirement.uri}`
                : EMPTY('boost URI');

        case 'ctdl-ctid':
            return requirement.ctid
                ? `CTDL ${requirement.ctid}`
                : EMPTY('CTID');

        case 'issuer-credential-id': {
            const id = requirement.credentialId || EMPTY('credential id');
            const issuer = requirement.issuerDid || EMPTY('issuer DID');

            return `${id} from ${issuer}`;
        }

        case 'ob-achievement':
            return requirement.achievementId
                ? `achievement ${requirement.achievementId}`
                : EMPTY('achievement id');

        case 'ob-alignment':
            return requirement.targetUrl
                ? `aligned to ${requirement.targetUrl}`
                : EMPTY('alignment target');

        case 'skill-tag':
            return requirement.tag
                ? `tagged \u201C${requirement.tag}\u201D`
                : EMPTY('skill tag');

        case 'score-threshold': {
            const type = requirement.type.trim() || EMPTY('credential type');
            const field = requirement.field.trim() || EMPTY('field');

            return `${type} with ${field} ${requirement.op} ${requirement.value}`;
        }

        case 'any-of':
        case 'all-of': {
            const joiner = requirement.kind === 'any-of' ? 'any of' : 'all of';

            if (requirement.of.length === 0) {
                return `${joiner} (empty)`;
            }

            // Single-child composite round-trips as the child \u2014 the
            // "any of (X)" reads as redundant and the author would
            // never intentionally author that shape. Prefer the flat
            // form so the summary stays readable.
            if (requirement.of.length === 1) {
                return summarizeRequirement(requirement.of[0], depth);
            }

            // Truncate beyond two levels. The editor itself shows the
            // full tree; this is just a readable one-liner.
            if (depth >= 2) {
                return `${joiner} (\u2026${requirement.of.length} rules)`;
            }

            const parts = requirement.of.map(child =>
                summarizeRequirement(child, depth + 1),
            );

            const joined = parts.join('; ');

            // Wrap in parens when nested so the composition is
            // unambiguous ("any of: X; all of: Y; Z" is ambiguous
            // without grouping).
            return depth > 0 ? `(${joiner}: ${joined})` : `${joiner}: ${joined}`;
        }
    }
};
