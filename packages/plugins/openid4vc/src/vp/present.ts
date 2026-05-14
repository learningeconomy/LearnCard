import { UnsignedVP } from '@learncard/types';

import { inferCredentialFormat } from './select';
import type {
    CandidateCredential,
    PresentationSubmission,
    PresentationSubmissionDescriptor,
} from './select';
import { PresentationDefinition } from './types';

/**
 * Slice 7a — **Verifiable Presentation construction**.
 *
 * Given a user's per-descriptor credential picks and the verifier's
 * Presentation Definition, produce:
 *
 * 1. An unsigned W3C `VerifiablePresentation` object ready to be
 *    signed (via `learnCard.invoke.issuePresentation` for `ldp_vp`, or
 *    via the Slice 7b JWT signer for `jwt_vp_json`).
 * 2. A DIF PEX v2 `PresentationSubmission` whose `descriptor_map`
 *    paths correctly target each credential inside the final
 *    `vp_token` for the chosen envelope format.
 * 3. The envelope format id (`ldp_vp` | `jwt_vp_json`) so the caller
 *    knows which signing path to invoke.
 *
 * **Pure and synchronous.** This layer never signs, never POSTs, and
 * never touches the holder's private keys. All transport /
 * cryptographic work happens in Slices 7b and 7c.
 *
 * ## Descriptor map semantics
 *
 * The DIF PEX spec (§6 "Presentation Submission") evaluates
 * `descriptor_map[n].path` as a JSONPath over the vp_token **after
 * decoding** when the outer token is a JWT. We emit paths that match
 * what every mainstream verifier (walt.id, Sphereon, EUDI, Animo)
 * actually resolves:
 *
 * - Outer `ldp_vp` envelope → `path: "$.verifiableCredential[N]"`
 * - Outer `jwt_vp_json` envelope → `path: "$.vp.verifiableCredential[N]"`
 *
 * For mixed inner formats (e.g. a `jwt_vc_json` VC embedded alongside
 * an `ldp_vc` inside an `ldp_vp`), the per-credential `format` field
 * discriminates without needing `path_nested` — the path still
 * resolves directly to the credential value at that index.
 */

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

/**
 * Envelope format for the outer Verifiable Presentation.
 *
 * - `ldp_vp` — plain JSON-LD VP, signed with a Linked-Data / Data
 *   Integrity proof (Slice 7b routes this through
 *   `learnCard.invoke.issuePresentation`).
 * - `jwt_vp_json` — compact JWS whose payload wraps the VP under a
 *   top-level `vp` claim (VCDM §6.3.1).
 */
export type VpFormat = 'ldp_vp' | 'jwt_vp_json';

/**
 * A single user pick: "this candidate satisfies this input_descriptor".
 * Wallets typically build this list from the SelectionResult by showing
 * the per-descriptor candidate lists and letting the user tap once per
 * row.
 */
export interface ChosenCredential {
    descriptorId: string;
    candidate: CandidateCredential;
}

export interface BuildPresentationOptions {
    /** The verifier's Presentation Definition (used for `definition_id` + format hints). */
    pd: PresentationDefinition;

    /**
     * The holder's picks, in presentation order. The resulting VP's
     * `verifiableCredential` array mirrors this order, and every
     * `descriptor_map` entry points at the matching index.
     */
    chosen: ChosenCredential[];

    /** Holder DID, emitted as `unsignedVp.holder`. Required for VCDM §4.1.1 compliance. */
    holder: string;

    /**
     * Override the envelope format. By default we infer from
     * `pd.format` (if the verifier declared preference) and fall back
     * to matching the chosen credentials' inner format.
     */
    envelopeFormat?: VpFormat;

    /** Override the submission id. Defaults to a short random hex id. */
    submissionId?: string;

    /** Override the VP id. Defaults to `urn:uuid:<v4>`. */
    presentationId?: string;

    /** Seam for deterministic tests. Defaults to a `crypto.getRandomValues`-backed id. */
    makeId?: () => string;
}

export interface PreparedPresentation {
    /**
     * Unsigned W3C Verifiable Presentation. Shape is the same for both
     * envelope formats; the signing step differs.
     *
     * - For `ldp_vp`: pass this straight to
     *   `learnCard.invoke.issuePresentation(unsignedVp, signingOptions)`.
     * - For `jwt_vp_json`: wrap as the `vp` claim of a JWT and sign
     *   (Slice 7b).
     */
    unsignedVp: UnsignedVP;

    /** Ready-to-submit DIF PEX v2 Presentation Submission. */
    submission: PresentationSubmission;

    /** Outer envelope format id. */
    vpFormat: VpFormat;

    /**
     * Per-credential format id, in the same order as
     * `unsignedVp.verifiableCredential`. Slice 7b / 7c use this to
     * decide serialization (compact JWS string vs. JSON object).
     */
    innerFormats: string[];
}

/* -------------------------------------------------------------------------- */
/*                                  errors                                    */
/* -------------------------------------------------------------------------- */

export type BuildPresentationErrorCode =
    | 'no_selections'
    | 'unknown_descriptor'
    | 'unknown_credential_format'
    | 'invalid_jwt_vc';

export class BuildPresentationError extends Error {
    readonly code: BuildPresentationErrorCode;

    constructor(code: BuildPresentationErrorCode, message: string) {
        super(message);
        this.name = 'BuildPresentationError';
        this.code = code;
    }
}

/* -------------------------------------------------------------------------- */
/*                               public surface                               */
/* -------------------------------------------------------------------------- */

/**
 * Build a VerifiablePresentation + PresentationSubmission from a
 * user's credential picks. See module doc for behavior.
 *
 * Validates input eagerly so callers get actionable errors instead of
 * a malformed VP that the verifier silently rejects:
 *
 * - `no_selections` — `chosen` is empty.
 * - `unknown_descriptor` — a pick references an id that doesn't exist
 *   in the PD's input_descriptors.
 * - `unknown_credential_format` — a candidate's format can't be
 *   inferred AND wasn't explicitly declared.
 * - `invalid_jwt_vc` — a candidate tagged `jwt_vc_json` has neither a
 *   compact JWS string nor a `proof.jwt` we can extract.
 */
export const buildPresentation = (
    options: BuildPresentationOptions
): PreparedPresentation => {
    const { pd, chosen, holder } = options;

    if (!chosen || chosen.length === 0) {
        throw new BuildPresentationError(
            'no_selections',
            'buildPresentation requires at least one chosen credential'
        );
    }

    const descriptorIds = new Set(pd.input_descriptors.map(d => d.id));

    // Normalize each pick into (innerFormat, serializedCredential).
    const normalized = chosen.map((pick, index) => {
        if (!descriptorIds.has(pick.descriptorId)) {
            throw new BuildPresentationError(
                'unknown_descriptor',
                `Chosen credential at index ${index} references unknown descriptor "${pick.descriptorId}"`
            );
        }

        return {
            descriptorId: pick.descriptorId,
            ...normalizeForEmbedding(pick.candidate, index),
        };
    });

    const vpFormat =
        options.envelopeFormat ?? inferEnvelopeFormat(pd, normalized.map(n => n.format));

    const makeId = options.makeId ?? defaultMakeId;

    const unsignedVp: UnsignedVP = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: options.presentationId ?? `urn:uuid:${makeUuidV4(makeId)}`,
        type: ['VerifiablePresentation'],
        holder,
        verifiableCredential: normalized.map(n => n.credential) as UnsignedVP['verifiableCredential'],
    };

    const submission: PresentationSubmission = {
        id: options.submissionId ?? makeId(),
        definition_id: pd.id,
        descriptor_map: normalized.map((n, index): PresentationSubmissionDescriptor => ({
            id: n.descriptorId,
            format: n.format,
            path: pathForIndex(index, vpFormat),
        })),
    };

    return {
        unsignedVp,
        submission,
        vpFormat,
        innerFormats: normalized.map(n => n.format),
    };
};

/* -------------------------------------------------------------------------- */
/*                                internals                                   */
/* -------------------------------------------------------------------------- */

interface NormalizedCandidate {
    /** Value to embed into `unsignedVp.verifiableCredential` at this index. */
    credential: unknown;
    /** Credential format id for the `descriptor_map` entry. */
    format: string;
}

/**
 * Turn a CandidateCredential into the exact value the VP should carry
 * at its verifiableCredential[N] slot:
 *
 * - `ldp_vc` → W3C VC JSON object (passed through).
 * - `jwt_vc_json` → compact JWS string. If the candidate arrived in
 *   "normalized W3C wrapper" form (the shape our VCI pipeline writes
 *   to disk — a W3C VC object with `proof.jwt` holding the compact
 *   JWS), we unwrap to the JWS string so verifier paths like
 *   `$.verifiableCredential[0]` resolve to the string they expect
 *   rather than to a nested W3C object with an embedded JWT.
 */
const normalizeForEmbedding = (
    candidate: CandidateCredential,
    index: number
): NormalizedCandidate => {
    const format = candidate.format ?? inferCredentialFormat(candidate.credential);

    if (!format) {
        throw new BuildPresentationError(
            'unknown_credential_format',
            `Chosen credential at index ${index} has no detectable format (provide candidate.format or a shape inferCredentialFormat recognizes)`
        );
    }

    if (format === 'jwt_vc_json') {
        const jws = extractCompactJws(candidate.credential);
        if (!jws) {
            throw new BuildPresentationError(
                'invalid_jwt_vc',
                `Chosen credential at index ${index} is tagged jwt_vc_json but has no compact JWS (expected a string, or an object with string \`proof.jwt\`)`
            );
        }
        return { credential: jws, format };
    }

    return { credential: candidate.credential, format };
};

const extractCompactJws = (credential: unknown): string | undefined => {
    if (typeof credential === 'string') {
        return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(credential)
            ? credential
            : undefined;
    }

    if (credential && typeof credential === 'object') {
        const proof = (credential as { proof?: unknown }).proof;
        if (proof && typeof proof === 'object') {
            const jwt = (proof as { jwt?: unknown }).jwt;
            if (typeof jwt === 'string') return jwt;
        }
    }

    return undefined;
};

/**
 * Decide which outer envelope format to use when the caller didn't
 * pin one. Preference order:
 *
 * 1. Honor `pd.format` if it explicitly allows exactly one VP format
 *    (only `jwt_vp_json` → jwt; only `ldp_vp` → ldp).
 * 2. If `pd.format` allows both, match the inner format homogeneity:
 *    all jwt_vc_json → jwt_vp_json; all ldp_vc → ldp_vp; mixed →
 *    ldp_vp (JSON-LD envelopes tolerate mixed-format `verifiableCredential`
 *    arrays transparently).
 * 3. If `pd.format` says nothing about VPs, infer purely from inner
 *    formats with the same "all-or-ldp_vp" rule.
 */
const inferEnvelopeFormat = (
    pd: PresentationDefinition,
    innerFormats: string[]
): VpFormat => {
    const declaredVpFormats = vpFormatsFromDesignation(pd.format);

    const inferred = homogeneousVpFormatFromInner(innerFormats);

    if (declaredVpFormats.has('jwt_vp_json') && !declaredVpFormats.has('ldp_vp')) {
        return 'jwt_vp_json';
    }

    if (declaredVpFormats.has('ldp_vp') && !declaredVpFormats.has('jwt_vp_json')) {
        return 'ldp_vp';
    }

    if (declaredVpFormats.has('jwt_vp_json') && declaredVpFormats.has('ldp_vp')) {
        return inferred;
    }

    return inferred;
};

const vpFormatsFromDesignation = (
    designation: PresentationDefinition['format']
): Set<VpFormat> => {
    const set = new Set<VpFormat>();
    if (!designation) return set;
    if ('jwt_vp_json' in designation) set.add('jwt_vp_json');
    if ('ldp_vp' in designation) set.add('ldp_vp');
    return set;
};

const homogeneousVpFormatFromInner = (innerFormats: string[]): VpFormat => {
    if (innerFormats.length === 0) return 'ldp_vp';
    const allJwt = innerFormats.every(f => f === 'jwt_vc_json');
    return allJwt ? 'jwt_vp_json' : 'ldp_vp';
};

const pathForIndex = (index: number, vpFormat: VpFormat): string =>
    vpFormat === 'jwt_vp_json'
        ? `$.vp.verifiableCredential[${index}]`
        : `$.verifiableCredential[${index}]`;

/* -------------------------------------------------------------------------- */
/*                              id generation                                 */
/* -------------------------------------------------------------------------- */

const defaultMakeId = (): string => {
    const cryptoObj: { getRandomValues?: (a: Uint8Array) => Uint8Array } | undefined =
        typeof globalThis !== 'undefined' && 'crypto' in globalThis
            ? (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto
            : undefined;

    if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
        const bytes = new Uint8Array(8);
        cryptoObj.getRandomValues(bytes);
        return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    }

    return Math.random().toString(36).slice(2, 18);
};

/**
 * Build a v4 UUID string using the caller-supplied random generator
 * (so tests can inject deterministic output). Falls back to a coarse
 * Math.random-based generator if the supplied id isn't hex-shaped —
 * the presentation id only needs to be unique per submission, not
 * cryptographically strong.
 */
const makeUuidV4 = (makeId: () => string): string => {
    const hex = makeId().replace(/[^0-9a-f]/gi, '');
    const padded = (hex + '0'.repeat(32)).slice(0, 32);
    return [
        padded.slice(0, 8),
        padded.slice(8, 12),
        // Force version 4 nibble so the id parses as a v4 UUID.
        '4' + padded.slice(13, 16),
        // Force variant 10xx nibble.
        ((parseInt(padded.charAt(16), 16) & 0x3) | 0x8).toString(16) + padded.slice(17, 20),
        padded.slice(20, 32),
    ].join('-');
};
