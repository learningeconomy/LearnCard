/**
 * credentialIdentity — turn any VC-shaped object into a normalised
 * `CredentialIdentity` fingerprint.
 *
 * ## The problem
 *
 * A VC identifies itself through an ever-growing set of schemes:
 *
 *   - W3C `type` (array) and `issuer` (string or `{ id }`).
 *   - W3C `id` — a stable credential id, sometimes issuer-scoped.
 *   - OBv3 `credentialSubject.achievement.id` — a stable identifier
 *     for the achievement itself (distinct from the credential).
 *   - OBv3 `credentialSubject.achievement.alignments[].targetUrl` —
 *     external framework references (CASE, ASN, O*NET, RSDs).
 *   - LearnCard boost URIs — the wallet's canonical pointer back
 *     to the boost artefact.
 *   - Credential Engine Registry CTIDs (`ce-<uuid>`) — the CTDL
 *     namespace.
 *   - Skill tags scattered across `tag`, `keywords`,
 *     `achievement.tag`, and alignment `targetCode`.
 *
 * Every downstream consumer (the matcher, the UI, future sync)
 * needs a uniform way to ask "what does this credential claim to
 * be?". Doing that extraction inline at each consumer would duplicate
 * subtle parsing logic and drift — the OBv3 achievement field moved
 * between versions, namespace prefixes appear and disappear, CTIDs
 * sometimes arrive as URIs (`https://credentialregistry.org/resources/ce-...`)
 * and sometimes bare.
 *
 * ## The shape
 *
 * One chain of small, pure extractors. Each extractor reads one
 * well-defined field from the VC and returns a partial
 * `CredentialIdentity`. The chain merges them; later extractors win
 * on conflicts (rare, and deliberate — publisher-supplied provenance
 * hints always beat heuristic extraction).
 *
 * Adding a new identity scheme is *one file change*: write a new
 * extractor, register it. No core refactor required. That's the
 * extensibility contract this module exists to provide.
 *
 * ## What this is NOT
 *
 * - This is not validation. A VC with a nonsensical structure still
 *   produces an identity — fields simply stay absent. The matcher
 *   decides whether the identity satisfies a requirement.
 * - This is not trust. An identity never carries trust-tier info;
 *   trust classification happens at binding time.
 * - This is not storage. Identities are derived on demand from the
 *   raw VC; they are not persisted. If the extraction rules change,
 *   the next reactor pass picks up the new identity for free.
 */

import type { VcLike } from './outcomeMatcher';

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

/**
 * Structural fingerprint of a credential. Every field is optional
 * except `types` and `raw`; callers must tolerate absent fields and
 * should treat "absent" as "we couldn't extract this, try another
 * requirement kind", not "this credential explicitly lacks it".
 */
export interface CredentialIdentity {
    /**
     * Union of every `type` string on the credential, with
     * common namespace prefixes stripped for convenience. The
     * matcher does its own stripping too — this pre-normalisation
     * is an optimisation, not a guarantee.
     */
    types: string[];

    /** Issuer DID or URL, normalised to a string. Null when absent. */
    issuerDid: string | null;

    /** W3C `id` field. Null when absent. */
    credentialId: string | null;

    /** Canonical LearnCard boost URI, if known. */
    boostUri?: string;

    /** Credential Engine Registry CTID (`ce-<uuid>`), if present. */
    ctdlCtid?: string;

    /** OBv3 `credentialSubject.achievement.id`, if present. */
    obAchievementId?: string;

    /** Target URLs from `achievement.alignments[].targetUrl`, deduped. */
    obAlignments?: string[];

    /** Skill tags harvested from OB/achievement metadata, deduped. */
    skillTags?: string[];

    /**
     * Escape hatch: the raw VC (as `VcLike`) so matchers for new
     * identity schemes can read fields the structural fingerprint
     * doesn't yet cover. Used sparingly — if a matcher reaches
     * through `raw` twice, that field belongs on `CredentialIdentity`.
     */
    raw: VcLike;
}

/**
 * Provenance hints supplied by the ingest publisher. These always
 * override anything a later extractor might infer, on the
 * principle that the publisher is authoritative about its own
 * context. See `types/walletEvent.ts` for where these come from.
 */
export interface IdentityExtractionHints {
    /** Set by claim-link ingests to pin the boost URI. */
    boostUri?: string;
    /** Set by consent-flow sync ingests. Not currently extracted elsewhere. */
    contractUri?: string;
}

// ---------------------------------------------------------------------------
// Small parsing helpers — kept private so every extractor uses the
// same rules. Exported tests pin down the edge cases.
// ---------------------------------------------------------------------------

/** Normalise `type` (string or array) into a deduped array. */
const asTypeArray = (type: VcLike['type']): string[] => {
    if (!type) return [];
    if (typeof type === 'string') return [type];

    return Array.from(new Set(type));
};

/** Strip common namespace prefixes — `ns:foo`, `https://example.com#foo`. */
const stripPrefix = (value: string): string => value.replace(/^.*[:/#]/, '');

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim() !== '';

/** Issuer DID / URL as a string. Handles string-shaped and object-shaped issuers. */
const extractIssuerId = (issuer: VcLike['issuer']): string | null => {
    if (!issuer) return null;
    if (typeof issuer === 'string') return issuer;
    if (typeof issuer === 'object' && isNonEmptyString(issuer.id)) return issuer.id;

    return null;
};

/**
 * VCs sometimes carry multiple `credentialSubject` entries (W3C
 * allows an array). Normalise to an array; a singleton subject is
 * wrapped, a missing subject returns empty. Every extractor walks
 * the array.
 */
const subjectObjects = (vc: VcLike): Array<Record<string, unknown>> => {
    const subject = vc.credentialSubject;

    if (!subject) return [];
    if (Array.isArray(subject)) return subject;

    return [subject];
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

    return value as Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Extractors — one small pure function per identity scheme.
//
// Each reads from the VC (and optionally the hints) and returns a
// partial `CredentialIdentity`. The chain runner below merges the
// partials in order; later extractors overwrite earlier on conflict.
// Order matters: provenance hints run last so they always win.
// ---------------------------------------------------------------------------

type IdentityExtractor = (
    vc: VcLike,
    hints: IdentityExtractionHints,
) => Partial<CredentialIdentity>;

const extractTypes: IdentityExtractor = (vc) => {
    // Both the raw `type` strings and their namespace-stripped forms
    // are kept, because pathway authors sometimes write the short
    // form (`AWSCertifiedCloudPractitioner`) and sometimes the fully
    // qualified form. Having both in `types` lets the matcher do a
    // single pass without re-normalising.
    const raw = asTypeArray(vc.type);
    const stripped = raw.map(stripPrefix);
    const unique = Array.from(new Set([...raw, ...stripped]));

    return { types: unique };
};

const extractIssuer: IdentityExtractor = (vc) => ({
    issuerDid: extractIssuerId(vc.issuer),
});

const extractCredentialId: IdentityExtractor = (vc) => {
    const id = vc.id;

    return { credentialId: isNonEmptyString(id) ? id : null };
};

/**
 * OBv3 achievement id lives at `credentialSubject.achievement.id`.
 * Some issuers emit the field as an array of achievements; we
 * capture the first. Rare to have multiple, and the matcher can
 * express "any of" composition for edge cases.
 */
const extractObAchievement: IdentityExtractor = (vc) => {
    for (const subject of subjectObjects(vc)) {
        const achievement = subject.achievement;

        if (Array.isArray(achievement)) {
            for (const entry of achievement) {
                const record = asRecord(entry);

                if (record && isNonEmptyString(record.id)) {
                    return { obAchievementId: record.id };
                }
            }

            continue;
        }

        const record = asRecord(achievement);

        if (record && isNonEmptyString(record.id)) {
            return { obAchievementId: record.id };
        }
    }

    return {};
};

/**
 * OBv3 alignments — each achievement carries an `alignments` array
 * whose entries reference external frameworks. We flatten the
 * targetUrls across every alignment on every achievement. Dedup
 * is done in the merger.
 */
const extractObAlignments: IdentityExtractor = (vc) => {
    const urls: string[] = [];

    const collect = (achievement: unknown) => {
        const record = asRecord(achievement);

        if (!record) return;

        const alignments = record.alignments;

        if (!Array.isArray(alignments)) return;

        for (const alignment of alignments) {
            const alignmentRecord = asRecord(alignment);

            if (alignmentRecord && isNonEmptyString(alignmentRecord.targetUrl)) {
                urls.push(alignmentRecord.targetUrl);
            }
        }
    };

    for (const subject of subjectObjects(vc)) {
        const achievement = subject.achievement;

        if (Array.isArray(achievement)) {
            for (const entry of achievement) collect(entry);
        } else {
            collect(achievement);
        }
    }

    if (urls.length === 0) return {};

    return { obAlignments: Array.from(new Set(urls)) };
};

/**
 * CTIDs arrive in several forms across the CTDL ecosystem:
 *
 *   - bare (`ce-abcdef...`) in a `ctid` or `sourceCtid` field
 *   - embedded in a Credential Engine URL
 *     (`https://credentialregistry.org/resources/ce-...`)
 *   - as `@id` on a referenced CTDL node
 *
 * We scan the well-known fields first, then fall back to URL
 * detection on `sourceUri` / `id`. Permissive by design — a false
 * positive produces a CTID that no requirement matches; a false
 * negative silently breaks a CTID-based author rule.
 */
const CTID_REGEX = /(ce-[0-9a-f-]{32,})/i;

const findCtid = (value: unknown): string | null => {
    if (!isNonEmptyString(value)) return null;

    const match = value.match(CTID_REGEX);

    return match ? match[1] : null;
};

const extractCtdlCtid: IdentityExtractor = (vc) => {
    const candidates: unknown[] = [
        (vc as Record<string, unknown>).ctid,
        (vc as Record<string, unknown>).sourceCtid,
        (vc as Record<string, unknown>).sourceUri,
        vc.id,
    ];

    for (const subject of subjectObjects(vc)) {
        candidates.push(
            subject.ctid,
            subject.sourceCtid,
            subject.sourceUri,
            subject.id,
        );

        const achievement = subject.achievement;
        const record = Array.isArray(achievement) ? asRecord(achievement[0]) : asRecord(achievement);

        if (record) {
            candidates.push(
                record.ctid,
                record.sourceCtid,
                record.sourceUri,
                record.id,
            );
        }
    }

    for (const candidate of candidates) {
        const ctid = findCtid(candidate);

        if (ctid) return { ctdlCtid: ctid.toLowerCase() };
    }

    return {};
};

/**
 * Harvest skill tags from the three places OBv3/CTDL issuers
 * commonly park them. We dedup at the end; the matcher does
 * string-equality checks, so normalising case is important —
 * skill URIs typically arrive canonical, but freeform tags
 * ("Least Privilege", "least-privilege") should match regardless.
 */
const extractSkillTags: IdentityExtractor = (vc) => {
    const tags: string[] = [];

    const pushTagArray = (value: unknown): void => {
        if (!Array.isArray(value)) return;

        for (const entry of value) {
            if (isNonEmptyString(entry)) tags.push(entry);
        }
    };

    pushTagArray((vc as Record<string, unknown>).tag);
    pushTagArray((vc as Record<string, unknown>).keywords);

    for (const subject of subjectObjects(vc)) {
        pushTagArray(subject.tag);
        pushTagArray(subject.keywords);

        const achievement = subject.achievement;
        const record = Array.isArray(achievement) ? asRecord(achievement[0]) : asRecord(achievement);

        if (record) {
            pushTagArray(record.tag);
            pushTagArray(record.keywords);

            const alignments = record.alignments;

            if (Array.isArray(alignments)) {
                for (const alignment of alignments) {
                    const alignmentRecord = asRecord(alignment);

                    if (alignmentRecord && isNonEmptyString(alignmentRecord.targetCode)) {
                        tags.push(alignmentRecord.targetCode);
                    }
                }
            }
        }
    }

    if (tags.length === 0) return {};

    // Normalise: trim, drop empty, dedup. We preserve the original
    // casing because skill-registry URIs are case-sensitive — the
    // matcher's free-tag variant handles case-folding separately.
    const normalised = Array.from(new Set(tags.map(t => t.trim()).filter(Boolean)));

    return { skillTags: normalised };
};

/**
 * Provenance hints from the publisher. Always runs last so hints
 * beat any heuristic extraction — the publisher knows the boost URI
 * or contract URI authoritatively; we shouldn't second-guess.
 */
const applyHints: IdentityExtractor = (_vc, hints) => {
    const partial: Partial<CredentialIdentity> = {};

    if (hints.boostUri) partial.boostUri = hints.boostUri;

    // contractUri is not currently part of the identity; we retain
    // the hint on the event itself for any downstream consumer that
    // wants it. If a requirement kind for contract-URI lands later,
    // we'd surface it here.

    return partial;
};

// ---------------------------------------------------------------------------
// Chain runner
// ---------------------------------------------------------------------------

const DEFAULT_EXTRACTORS: IdentityExtractor[] = [
    extractTypes,
    extractIssuer,
    extractCredentialId,
    extractObAchievement,
    extractObAlignments,
    extractCtdlCtid,
    extractSkillTags,
    applyHints,
];

/**
 * Extract a `CredentialIdentity` from any VC-shaped object.
 *
 * Each extractor runs against the raw VC; results are merged left-
 * to-right so later extractors overwrite earlier on conflict. The
 * provenance-hint extractor runs last, which is deliberate: the
 * publisher's claim about boost URI / contract URI is always more
 * authoritative than anything we could infer from the VC body.
 *
 * Custom extractor chains can be supplied for testing; production
 * always uses `DEFAULT_EXTRACTORS`.
 */
export const extractCredentialIdentity = (
    vc: VcLike,
    hints: IdentityExtractionHints = {},
    extractors: IdentityExtractor[] = DEFAULT_EXTRACTORS,
): CredentialIdentity => {
    let identity: CredentialIdentity = {
        types: [],
        issuerDid: null,
        credentialId: null,
        raw: vc,
    };

    for (const extractor of extractors) {
        const partial = extractor(vc, hints);

        identity = { ...identity, ...partial };
    }

    return identity;
};

/**
 * Re-exported so tests and authoring tools can reuse the default
 * chain without having to reconstruct it.
 */
export const DEFAULT_IDENTITY_EXTRACTORS = DEFAULT_EXTRACTORS;

export type { IdentityExtractor };
