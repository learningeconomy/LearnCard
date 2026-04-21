/**
 * CTDL (Credential Transparency Description Language) JSON-LD type
 * definitions — the subset we consume when importing pathways from the
 * Credential Engine Registry.
 *
 * See:
 *   - Credential Engine Registry: https://credentialengineregistry.org/
 *   - CTDL terms:                  https://credreg.net/ctdl/terms/
 *   - Pathway Builder guide:       https://guidance.credentialengine.org/pathway-builder-ctdl-pathways-and-credential-registry-pathway-builder/
 *
 * These types only cover the fields our `fromCtdlPathway` importer
 * actually reads. Unknown properties are allowed (forward compatibility)
 * but not typed.
 *
 * IMPORTANT: CTDL uses two representational forms for string-valued
 * properties:
 *
 *   - A plain ASCII string:         `"My Pathway"`
 *   - A language map:               `{ "en-US": "My Pathway", "es": "..." }`
 *
 * Both are valid per the spec. Our `getLocalizedString` helper handles
 * both and picks the best match for a preferred locale.
 */

// ---------------------------------------------------------------------------
// Primitive representational forms
// ---------------------------------------------------------------------------

/**
 * CTDL-style reference: either an inline object with `@id` or a bare
 * URI string. **Both forms are valid per JSON-LD and the real
 * Credential Engine Registry uses both in practice.**
 *
 * Concrete registry responses frequently use bare strings at the
 * pathway root (`ceterms:hasPart` in particular), while some
 * downstream fields use the object form. `extractRefIds` normalizes
 * the two shapes — always prefer it over reading refs manually.
 */
export type CtdlRef = string | { '@id': string };

/**
 * A language map as used by JSON-LD `@container: @language`. The map's
 * keys are BCP-47 language tags ("en-US", "en", "es", ...).
 */
export type CtdlLangMap = Record<string, string>;

/**
 * A string-valued property can arrive as a plain string OR a language map.
 * Helpers normalize both to a plain `string`.
 */
export type CtdlLocalizedString = string | CtdlLangMap;

/**
 * A list-valued property may arrive as a single object / URI or an
 * array. Helpers normalize both to an array.
 */
export type CtdlList<T> = T | T[] | undefined;

// ---------------------------------------------------------------------------
// Component types we recognize
// ---------------------------------------------------------------------------

export type CtdlComponentKind =
    | 'ceterms:CredentialComponent'
    | 'ceterms:AssessmentComponent'
    | 'ceterms:CourseComponent'
    | 'ceterms:JobComponent'
    | 'ceterms:CompetencyComponent'
    | 'ceterms:BasicComponent'
    | 'ceterms:SelectionComponent'
    | 'ceterms:ExtensionComponent'
    | 'ceterms:ComponentCondition';

// ---------------------------------------------------------------------------
// Pathway root
// ---------------------------------------------------------------------------

export interface CtdlPathway {
    '@id': string;
    '@type': 'ceterms:Pathway' | string;

    /** Stable short ID (`ce-<uuid>`). Always present in registry data. */
    'ceterms:ctid'?: string;

    'ceterms:name'?: CtdlLocalizedString;
    'ceterms:description'?: CtdlLocalizedString;
    'ceterms:subjectWebpage'?: string;

    /**
     * **Primary** membership vocabulary on the Pathway root: every
     * component that belongs to this pathway. This is what the
     * Credential Engine Registry emits in practice (verified against
     * the live IMA "AI in Finance" pathway). Refs arrive as bare URI
     * strings.
     */
    'ceterms:hasPart'?: CtdlList<CtdlRef>;

    /**
     * Alternate/legacy membership vocabulary. Some publisher tooling
     * emits `hasChild` at the Pathway root instead of `hasPart`. We
     * accept both — `getPathwayMemberRefs` unions them.
     */
    'ceterms:hasChild'?: CtdlList<CtdlRef>;

    /** The pathway's destination — what the learner is ultimately earning. */
    'ceterms:hasDestinationComponent'?: CtdlList<CtdlRef>;

    /** The organization publishing the pathway (reference by @id). */
    'ceterms:offeredBy'?: CtdlList<CtdlRef>;

    /** Any additional properties we don't explicitly consume. */
    [k: string]: unknown;
}

/**
 * Collect every component URI that belongs to the pathway at the
 * root level — the union of `hasPart` (standard) and `hasChild`
 * (legacy), de-duplicated while preserving first-occurrence order.
 *
 * Exported because both `fromCtdlPathway` (import) and
 * `fetchCtdlPathway` (network) need the same membership set, and
 * keeping the logic in one place means a future CTDL vocabulary
 * change only needs to update this helper.
 */
export const getPathwayMemberRefs = (pathway: CtdlPathway): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];

    for (const uri of [
        ...extractRefIds(pathway['ceterms:hasPart']),
        ...extractRefIds(pathway['ceterms:hasChild']),
    ]) {
        if (seen.has(uri)) continue;

        seen.add(uri);
        out.push(uri);
    }

    return out;
};

// ---------------------------------------------------------------------------
// Pathway component (node)
// ---------------------------------------------------------------------------

export interface CtdlPathwayComponent {
    '@id': string;
    '@type': CtdlComponentKind | string;

    'ceterms:ctid'?: string;
    'ceterms:name'?: CtdlLocalizedString;
    'ceterms:description'?: CtdlLocalizedString;

    /** Sub-type hint — e.g. "Pathway" or "Destination" or "Requirement". */
    'ceterms:componentCategory'?: CtdlLocalizedString;

    /** A `ceterms:CredentialType` reference (e.g. "ceterms:Badge"). */
    'ceterms:credentialType'?: CtdlList<CtdlRef | string>;

    /** URL to the real-world credential / course / assessment. */
    'ceterms:sourceData'?: string;

    /**
     * Human-readable landing page for the component (inherited from the
     * CTDL Resource base). Not a guaranteed "earn it here" link — often
     * a marketing page — so we degrade the CTA copy accordingly.
     */
    'ceterms:subjectWebpage'?: string;

    /** Badge / certificate artwork URL. Often missing on the component
     * itself — when it is, the importer falls back to the proxied
     * credential's `ceterms:image`. */
    'ceterms:image'?: string;

    /** Declarative proxy — the actual credential/course referenced. */
    'ceterms:proxyFor'?: string;

    /** Nodes that come *after* this one in the graph. */
    'ceterms:hasChild'?: CtdlList<CtdlRef>;

    /** Conditions that gate this component. v1 simplifies these to AND. */
    'ceterms:hasCondition'?: CtdlList<CtdlRef>;

    /** Competencies / alignment this component targets. */
    'ceterms:targetCompetency'?: CtdlList<CtdlRef | string>;

    [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Proxied credential (target of `ceterms:proxyFor`)
// ---------------------------------------------------------------------------

/**
 * A CTDL credential resource (`ceterms:Badge`, `ceterms:Certificate`,
 * etc.) referenced from a `CredentialComponent` via `ceterms:proxyFor`.
 *
 * The pathway component typically carries only the *name* of what the
 * learner will earn; the rich, learner-facing data (landing page URL,
 * badge image, longer description) lives on the proxied credential.
 * Real-world example — the IMA "AI in Finance" pathway: each node
 * component has no `subjectWebpage` or `image` of its own, but its
 * `proxyFor` target (a `ceterms:Badge`) has both. We resolve the proxy
 * so that UI can render the real landing page and badge image.
 *
 * Only the fields the importer actually merges are typed; everything
 * else is passthrough via the index signature.
 */
export interface CtdlCredential {
    '@id': string;
    '@type'?: string;

    'ceterms:ctid'?: string;
    'ceterms:name'?: CtdlLocalizedString;
    'ceterms:description'?: CtdlLocalizedString;

    /** Issuer's canonical landing page for the credential. */
    'ceterms:subjectWebpage'?: string;

    /** Badge / certificate artwork URL. */
    'ceterms:image'?: string;

    /** Where to actually earn this (rare, but sometimes on the cred). */
    'ceterms:sourceData'?: string;

    [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Import surface — the exact data `fromCtdlPathway` consumes.
// ---------------------------------------------------------------------------

/**
 * The "graph" of a CTDL pathway import: the pathway itself plus every
 * component referenced by `hasChild` and `hasDestinationComponent`,
 * indexed by `@id` for lookup.
 *
 * `fetchCtdlPathwayById` assembles this from live registry calls;
 * tests construct it from fixtures.
 *
 * `proxies` holds credential resources resolved from each component's
 * `ceterms:proxyFor` reference. It is optional because fixtures
 * predating proxy resolution (and simple CTDL pathways without proxies)
 * legitimately omit it.
 */
export interface CtdlGraph {
    pathway: CtdlPathway;
    components: Record<string, CtdlPathwayComponent>;
    proxies?: Record<string, CtdlCredential>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Pull a human-readable string out of a CTDL property that may be either
 * a plain string or a language map. Prefers `en-US` → `en` → any first
 * value; returns an empty string when nothing is present.
 *
 * Kept pure and dependency-free so it's trivially testable.
 */
export const getLocalizedString = (
    value: CtdlLocalizedString | undefined,
    preferredLocale = 'en-US',
): string => {
    if (!value) return '';

    if (typeof value === 'string') return value;

    // Exact preferred-locale match first.
    const exact = value[preferredLocale];

    if (exact) return exact;

    // Match on language prefix ("en-US" → anything starting with "en-").
    const prefix = preferredLocale.split('-')[0];
    const byPrefix = Object.entries(value).find(([tag]) =>
        tag.toLowerCase().startsWith(`${prefix.toLowerCase()}-`) ||
        tag.toLowerCase() === prefix.toLowerCase(),
    );

    if (byPrefix) return byPrefix[1];

    // Fall back to the first value — better to show *something* than
    // nothing.
    const first = Object.values(value)[0];

    return first ?? '';
};

/**
 * Normalize a CTDL list-or-single-value field to a real array.
 */
export const toArray = <T>(value: CtdlList<T>): T[] => {
    if (value === undefined || value === null) return [];

    return Array.isArray(value) ? value : [value];
};

/**
 * Extract the `@id` URIs from a list of CTDL refs, accepting both
 * representational forms:
 *
 *   - Bare URI strings:  `"https://.../ce-abc"`
 *   - Object refs:        `{ "@id": "https://.../ce-abc" }`
 *
 * Real Credential Engine Registry responses mix these freely — in
 * particular, `ceterms:hasPart` and `ceterms:hasDestinationComponent`
 * on the Pathway root are emitted as bare-string arrays, while some
 * downstream fields use object refs. Silently normalizing both
 * shapes lets the rest of the pipeline treat them uniformly.
 */
export const extractRefIds = (value: CtdlList<CtdlRef>): string[] => {
    return toArray(value)
        .map(ref => {
            if (typeof ref === 'string') return ref;
            if (typeof ref === 'object' && ref !== null && '@id' in ref) {
                return ref['@id'];
            }

            return null;
        })
        .filter((id): id is string => typeof id === 'string' && id.length > 0);
};

/**
 * Recognize the last path segment of a URI as a CTDL CTID when it
 * begins with `ce-`. Many CTDL URIs have the form
 * `https://credentialengineregistry.org/resources/ce-<uuid>`.
 */
export const extractCtidFromUri = (uri: string): string | undefined => {
    const match = uri.match(/\/(ce-[a-f0-9-]+)(?:$|\?|#)/i);

    return match ? match[1] : undefined;
};
