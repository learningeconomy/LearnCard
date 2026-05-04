import { matchInputDescriptor, DescriptorMatch } from './pex';
import {
    ClaimFormatDesignation,
    InputDescriptor,
    PresentationDefinition,
    SubmissionRequirement,
} from './types';

/**
 * Given the holder's full credential pool and a verifier's Presentation
 * Definition, figure out which credentials are eligible to satisfy each
 * `input_descriptor`, whether the overall submission is possible, and
 * produce a ready-to-serialize PresentationSubmission skeleton.
 *
 * This is the "preview" half of the OID4VP flow: the UI shows the user
 * the candidates returned here, they pick one per descriptor, and Slice
 * 7 builds + signs the actual `vp_token` using those selections.
 */

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

/**
 * A single credential paired with its inferred / declared format id.
 * Callers always pass in strings they've indexed themselves; we never
 * attempt to decrypt or verify the credential here.
 */
export interface CandidateCredential {
    /** The raw credential value — a JSON-LD object for ldp_vc or a compact JWT string for jwt_vc_json. */
    credential: unknown;
    /** Credential format id. Inferred via {@link inferCredentialFormat} when omitted. */
    format?: string;
    /**
     * Caller-provided identifier (URI, DB row id, etc.) used when
     * building audit logs and when binding selections back to storage.
     * Not part of the DIF PEX spec — ours alone.
     */
    id?: string;
}

export interface DescriptorCandidate {
    descriptorId: string;
    candidate: CandidateCredential;
    match: DescriptorMatch;
    /**
     * Absolute position in the caller's original `candidates` array.
     * Lets callers reconstruct their own state without string-matching.
     */
    candidateIndex: number;
}

export interface DescriptorSelection {
    descriptorId: string;
    /** Candidates that satisfied every required field + format constraint. */
    candidates: DescriptorCandidate[];
    /** Reason this descriptor has zero candidates (when applicable). */
    reason?: string;
}

export interface SelectionResult {
    /** One entry per input_descriptor, in the PD's declared order. */
    descriptors: DescriptorSelection[];

    /**
     * `true` when the Presentation Definition's submission requirements
     * (or, if none, all descriptors) can be satisfied by the candidate
     * pool. UIs use this to disable the "Share" button up front.
     */
    canSatisfy: boolean;

    /**
     * Human-readable reason shown to the user when `canSatisfy` is
     * false. Example: `"The verifier requires a UniversityDegree
     * credential and you don't have one."`
     */
    reason?: string;
}

/**
 * DIF PEX v2 Presentation Submission — what the wallet returns inside
 * the vp_token to tell the verifier which VC answered which descriptor.
 */
export interface PresentationSubmission {
    id: string;
    definition_id: string;
    descriptor_map: PresentationSubmissionDescriptor[];
}

export interface PresentationSubmissionDescriptor {
    id: string;
    format: string;
    path: string;
    path_nested?: PresentationSubmissionDescriptor;
}

/**
 * Input to {@link buildPresentationSubmission}: the user's per-descriptor
 * selection, along with the VP-internal path where the chosen VC will
 * appear (typically `$.verifiableCredential[N]`).
 */
export interface SelectedDescriptor {
    descriptorId: string;
    format: string;
    /**
     * JSONPath inside the outer vp_token where the credential will sit.
     * For a JSON-LD VP: `$.verifiableCredential[0]`.
     * For a JWT VP wrapping JSON-LD VCs: `$.vp.verifiableCredential[0]`.
     */
    path: string;
    /**
     * JSONPath inside a nested envelope. For jwt_vc_json credentials
     * embedded in a JSON-LD VP: `$` (the VC JWT is the whole value).
     * Only set when the credential is itself a wrapped envelope (JWT).
     */
    pathNested?: string;
}

/* -------------------------------------------------------------------------- */
/*                               public surface                               */
/* -------------------------------------------------------------------------- */

/**
 * Run the holder's candidate pool against every input_descriptor in the
 * PD. Each candidate must pass (a) any format constraint declared on
 * the descriptor (or, if the descriptor has none, on the PD itself),
 * and (b) every required field in `constraints.fields[]`.
 *
 * The result preserves the PD's declared descriptor order so UIs can
 * render "one row per descriptor".
 */
export const selectCredentials = (
    candidates: CandidateCredential[],
    pd: PresentationDefinition
): SelectionResult => {
    const enriched = candidates.map((c, index) => ({
        index,
        candidate: {
            ...c,
            format: c.format ?? inferCredentialFormat(c.credential),
        },
    }));

    const descriptors: DescriptorSelection[] = pd.input_descriptors.map(descriptor => {
        const matches: DescriptorCandidate[] = [];

        // Effective format designation: descriptor.format > pd.format.
        const formatDesignation = descriptor.format ?? pd.format;

        for (const entry of enriched) {
            const { candidate, index } = entry;

            if (formatDesignation && !formatIsPermitted(candidate.format, formatDesignation)) {
                continue;
            }

            const decoded = decodeCandidateForMatching(candidate);
            const match = matchInputDescriptor(decoded, descriptor);

            if (match.matched) {
                matches.push({
                    descriptorId: descriptor.id,
                    candidate,
                    match,
                    candidateIndex: index,
                });
            }
        }

        return {
            descriptorId: descriptor.id,
            candidates: matches,
            reason:
                matches.length === 0
                    ? explainNoMatches(descriptor, enriched.length, formatDesignation)
                    : undefined,
        };
    });

    const satisfiedIds = new Set(
        descriptors.filter(d => d.candidates.length > 0).map(d => d.descriptorId)
    );

    const requirementsResult = evaluateSubmissionRequirements(pd, satisfiedIds);

    return {
        descriptors,
        canSatisfy: requirementsResult.satisfied,
        reason: requirementsResult.satisfied ? undefined : requirementsResult.reason,
    };
};

/**
 * Build a DIF PEX v2 Presentation Submission descriptor map. The
 * caller is responsible for ordering selections (and computing the
 * `path` into their final vp_token shape) so this function is purely
 * a well-typed assembler — it never rearranges, never substitutes, and
 * never validates the selection against the PD.
 *
 * The `definition_id` must come from the original PD to satisfy
 * verifiers that cross-check the submission.
 */
export const buildPresentationSubmission = (
    pd: PresentationDefinition,
    selections: SelectedDescriptor[],
    options: { submissionId?: string; makeId?: () => string } = {}
): PresentationSubmission => {
    const makeId = options.makeId ?? defaultMakeId;

    return {
        id: options.submissionId ?? makeId(),
        definition_id: pd.id,
        descriptor_map: selections.map(selection => {
            const base: PresentationSubmissionDescriptor = {
                id: selection.descriptorId,
                format: selection.format,
                path: selection.path,
            };

            if (selection.pathNested) {
                base.path_nested = {
                    id: selection.descriptorId,
                    format: selection.format,
                    path: selection.pathNested,
                };
            }

            return base;
        }),
    };
};

/**
 * Best-effort inference of the credential format id from the value's
 * shape. Covers the two formats we've exercised end-to-end:
 *
 * - **`jwt_vc_json`** — compact JWS string (three base64url segments
 *   separated by `.`), OR a decoded VC whose `proof.type ===
 *   'JwtProof2020'` (the shape WaltID returns).
 * - **`ldp_vc`** — a JSON-LD VC with a Data Integrity / JCS / legacy
 *   `proof.type` (Ed25519Signature2020, DataIntegrityProof, etc.).
 *
 * Unknown shapes fall through to the caller-default `undefined`, which
 * surfaces in the selection pipeline as "no format declared".
 */
export const inferCredentialFormat = (credential: unknown): string | undefined => {
    if (typeof credential === 'string') {
        // Compact JWS has exactly three segments; a signed JSON-LD VC
        // is never serialized this way.
        return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(credential)
            ? 'jwt_vc_json'
            : undefined;
    }

    if (!credential || typeof credential !== 'object') return undefined;

    const vc = credential as Record<string, unknown>;
    const proof = vc.proof as Record<string, unknown> | undefined;

    if (proof && typeof proof === 'object') {
        if (typeof proof.jwt === 'string' || proof.type === 'JwtProof2020') {
            return 'jwt_vc_json';
        }
        // Every Data Integrity / legacy Linked Data Proof suite is ldp_vc
        // for OID4VP purposes. We don't need to discriminate by suite here.
        if (typeof proof.type === 'string') return 'ldp_vc';
    }

    return undefined;
};

/* -------------------------------------------------------------------------- */
/*                          submission_requirements                           */
/* -------------------------------------------------------------------------- */

interface RequirementOutcome {
    satisfied: boolean;
    reason?: string;
}

/**
 * Evaluate the PD's submission_requirements (if any) against the set of
 * input_descriptor ids that have at least one candidate. When no
 * submission_requirements are declared, DIF PEX §7 mandates that EVERY
 * input_descriptor must be satisfied.
 */
const evaluateSubmissionRequirements = (
    pd: PresentationDefinition,
    satisfiedIds: Set<string>
): RequirementOutcome => {
    const srs = pd.submission_requirements;

    if (!srs || srs.length === 0) {
        const unsatisfied = pd.input_descriptors
            .map(d => d.id)
            .filter(id => !satisfiedIds.has(id));

        if (unsatisfied.length === 0) return { satisfied: true };

        return {
            satisfied: false,
            reason:
                unsatisfied.length === 1
                    ? `Input descriptor "${unsatisfied[0]}" has no matching credential`
                    : `${unsatisfied.length} input descriptors have no matching credential: ${unsatisfied.join(', ')}`,
        };
    }

    for (const requirement of srs) {
        const outcome = evaluateRequirement(requirement, pd, satisfiedIds);
        if (!outcome.satisfied) return outcome;
    }

    return { satisfied: true };
};

const evaluateRequirement = (
    requirement: SubmissionRequirement,
    pd: PresentationDefinition,
    satisfiedIds: Set<string>
): RequirementOutcome => {
    // A group reference (`from`) and a nested set (`from_nested`) are
    // mutually exclusive per spec; we honour `from` first, then fall
    // back to `from_nested`.
    if (typeof requirement.from === 'string' && requirement.from.length > 0) {
        const groupDescriptors = pd.input_descriptors.filter(d =>
            d.group?.includes(requirement.from!)
        );

        if (groupDescriptors.length === 0) {
            return {
                satisfied: false,
                reason: `submission_requirement references unknown group "${requirement.from}"`,
            };
        }

        const satisfiedInGroup = groupDescriptors.filter(d => satisfiedIds.has(d.id));
        return applyRule(requirement, satisfiedInGroup.length, groupDescriptors.length);
    }

    if (Array.isArray(requirement.from_nested) && requirement.from_nested.length > 0) {
        let satisfiedNestedCount = 0;

        for (const nested of requirement.from_nested) {
            const outcome = evaluateRequirement(nested, pd, satisfiedIds);
            if (outcome.satisfied) satisfiedNestedCount += 1;
        }

        return applyRule(
            requirement,
            satisfiedNestedCount,
            requirement.from_nested.length
        );
    }

    return {
        satisfied: false,
        reason: 'submission_requirement has neither `from` nor `from_nested`',
    };
};

const applyRule = (
    requirement: SubmissionRequirement,
    actual: number,
    total: number
): RequirementOutcome => {
    const label = requirement.name ?? requirement.from ?? '<anonymous>';

    if (requirement.rule === 'all') {
        if (actual >= total) return { satisfied: true };

        return {
            satisfied: false,
            reason: `Requirement "${label}" (rule=all) needs ${total} matches, only ${actual} available`,
        };
    }

    if (requirement.rule === 'pick') {
        if (typeof requirement.count === 'number' && actual < requirement.count) {
            return {
                satisfied: false,
                reason: `Requirement "${label}" (rule=pick) needs count=${requirement.count} matches, only ${actual} available`,
            };
        }

        if (typeof requirement.min === 'number' && actual < requirement.min) {
            return {
                satisfied: false,
                reason: `Requirement "${label}" (rule=pick) needs min=${requirement.min} matches, only ${actual} available`,
            };
        }

        // `max` is a soft cap (the wallet is free to include fewer than
        // max when it wants to minimize disclosure), so we don't fail
        // here. The UI still shows it as guidance.

        // `pick` with no count/min and at least one match → satisfied.
        if (
            requirement.count === undefined &&
            requirement.min === undefined &&
            actual === 0
        ) {
            return {
                satisfied: false,
                reason: `Requirement "${label}" (rule=pick) needs at least one match, none available`,
            };
        }

        return { satisfied: true };
    }

    return {
        satisfied: false,
        reason: `Unknown submission_requirement rule "${requirement.rule}"`,
    };
};

/* -------------------------------------------------------------------------- */
/*                                helpers                                     */
/* -------------------------------------------------------------------------- */

/**
 * Check whether `format` appears in the given format designation. The
 * DIF PEX spec treats the format block as a set of allowed formats,
 * each carrying an optional `alg` / `proof_type` restriction. For
 * Slice 6 we only care about presence — algorithm-level matching
 * belongs in Slice 7 alongside proof verification.
 */
const formatIsPermitted = (
    credentialFormat: string | undefined,
    designation: Record<string, ClaimFormatDesignation>
): boolean => {
    if (!credentialFormat) return false;
    return Object.prototype.hasOwnProperty.call(designation, credentialFormat);
};

/**
 * Decode a candidate into a plain JSON object suitable for JSONPath
 * matching.
 *
 * For `jwt_vc_json` candidates the matching subject is the **JWT
 * payload**, not the inner `.vc` object. This is the convention every
 * mainstream PEX implementation (Sphereon, Credo-TS, walt.id) uses and
 * the reason verifiers write paths like `$.vc.type`, `$.iss`, or
 * `$.vc.credentialSubject.id` — they assume the payload is exposed
 * verbatim, with envelope claims (`iss`, `sub`, `exp`, …) addressable
 * as siblings of `vc`.
 *
 * Two candidate shapes resolve to a JWT-VC payload:
 *
 * 1. **Compact JWS string** — the on-the-wire shape. Decoded directly.
 * 2. **W3C VC object wrapping a JWT** — the shape issuers like WaltID
 *    (and our own `normalizeIssuedCredential`) return, with the raw
 *    compact JWS preserved under `proof.jwt` and `proof.type ===
 *    'JwtProof2020'`. We pull the JWT out of `proof.jwt` and decode
 *    that, so the same descriptor matches regardless of how the
 *    credential was stored on disk.
 *
 * Falls back to the raw value (and thus lets the match naturally fail)
 * for any decoding error, preserving the "no throws mid-selection"
 * contract of the selector.
 */
const decodeCandidateForMatching = (candidate: CandidateCredential): unknown => {
    const { credential, format } = candidate;

    if (format === 'jwt_vc_json') {
        if (typeof credential === 'string') {
            const payload = decodeJwtVc(credential);
            if (payload) return payload;
        }

        // W3C-shape JWT-VC: pull the raw JWS out of proof.jwt and decode.
        if (credential && typeof credential === 'object') {
            const proof = (credential as { proof?: unknown }).proof;
            if (proof && typeof proof === 'object') {
                const jwt = (proof as { jwt?: unknown }).jwt;
                if (typeof jwt === 'string') {
                    const payload = decodeJwtVc(jwt);
                    if (payload) return payload;
                }
            }
        }
    }

    return credential;
};

/**
 * Extract the full JWT payload from a compact JWT-VC. Returns
 * `undefined` on any decoding failure — callers fall back to the raw
 * value so the match naturally fails rather than throwing.
 *
 * The payload shape per VCDM §6.3.1 is `{ iss, sub, vc, jti, exp, iat,
 * nbf, ... }` with the W3C VC body under `vc`. We return the payload
 * verbatim so PEX paths can target either envelope claims (`$.iss`,
 * `$.exp`) or VC content (`$.vc.type`, `$.vc.credentialSubject.id`).
 */
const decodeJwtVc = (jwt: string): unknown => {
    const parts = jwt.split('.');
    if (parts.length !== 3) return undefined;

    try {
        return JSON.parse(base64UrlDecode(parts[1]));
    } catch {
        return undefined;
    }
};

const base64UrlDecode = (input: string): string => {
    const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
    const normalized = padded.replace(/-/g, '+').replace(/_/g, '/');

    // Browser + Node 16+: `atob` is globally available; no dependency needed.
    if (typeof atob === 'function') return atob(normalized);

    // Node < 16 fallback — keep this file free of node:buffer imports so
    // it bundles cleanly for the browser.
    return Buffer.from(normalized, 'base64').toString('binary');
};

const explainNoMatches = (
    descriptor: InputDescriptor,
    candidatePoolSize: number,
    formatDesignation: Record<string, ClaimFormatDesignation> | undefined
): string => {
    if (candidatePoolSize === 0) return 'You have no credentials in your wallet yet';

    const label = descriptor.name ?? descriptor.id;

    if (formatDesignation) {
        const allowed = Object.keys(formatDesignation).join(', ');
        return `No credential satisfies "${label}" (required format: ${allowed})`;
    }

    return `No credential satisfies "${label}"`;
};

/**
 * Generate a short, URL-safe, cryptographically-acceptable id for the
 * PresentationSubmission. The spec doesn't constrain format — only
 * uniqueness per submission — so we default to 16 random hex chars
 * when available.
 */
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
