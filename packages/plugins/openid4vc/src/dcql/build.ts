/**
 * Build per-credential-query unsigned VPs from a holder's chosen
 * credentials.
 *
 * # Why this exists in addition to `vp/present.ts:buildPresentation`
 *
 * The PEX builder produces ONE VP that wraps every chosen credential
 * (descriptor_map paths thread through it), plus a companion
 * `presentation_submission`. DCQL's response model is fundamentally
 * different per OID4VP 1.0 §6.4:
 *
 *   - `vp_token` is an OBJECT keyed by `credential_query_id`.
 *   - Each value is its own presentation (one VP per query entry, or
 *     an array when the query has `multiple: true`).
 *   - There is NO `presentation_submission` field — the keying does
 *     the descriptor-map's job implicitly.
 *
 * So this builder takes the same chosen-candidate inputs but returns
 * a per-query collection of `{ credentialQueryId, unsignedVp,
 * vpFormat, candidates }` entries. The signing layer (`./respond.ts`,
 * landing in the next step of this slice) loops over the result and
 * signs each VP individually before assembling the final vp_token
 * object.
 *
 * # Envelope format choice
 *
 * Pure inference from the corresponding query entry's `format`:
 *
 *   - `jwt_vc_json` → `jwt_vp_json` envelope
 *   - `ldp_vc`      → `ldp_vp` envelope
 *
 * No PD-style tie-breaking needed because DCQL queries pin a single
 * format per `credentials[]` entry. SD-JWT and mDoc formats throw
 * — they're tracked for a later slice (different signing pipeline).
 *
 * # Multiple candidates per query
 *
 * DCQL's `multiple: true` lets a single query entry pull more than one
 * credential. We honor this by packing all the candidates with the
 * same `credentialQueryId` into the SAME unsigned VP's
 * `verifiableCredential[]` array — the wallet returns one
 * presentation per query, period. Some verifiers may interpret
 * `multiple: true` as "return an array of presentations", but the
 * spec wording in §6.4 is "an array of one or more presentations" per
 * id, which a single VP carrying multiple VCs satisfies cleanly.
 * Re-visit if a real verifier proves otherwise.
 */
import type { UnsignedVP } from '@learncard/types';

import type { AdaptableCredential } from './adapt';
import type { DcqlQuery } from './types';
import type { SdJwtDiscloseFrame } from '../vp/sign';

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

/**
 * Outer envelope format for a DCQL per-query response. The first two
 * are W3C VP envelopes signed by the signing layer; the last two are
 * SD-JWT-VC passthroughs that carry the compact form directly into the
 * `vp_token` value (no VP envelope per OID4VP §6.1.1 — the issuer JWT
 * + disclosures + KB-JWT IS the presentation).
 */
export type DcqlVpFormat = 'jwt_vp_json' | 'ldp_vp' | 'dc+sd-jwt' | 'vc+sd-jwt';

/**
 * One holder pick: "this candidate satisfies this credential query."
 *
 * Direct analog of `vp/present.ts:ChosenCredential` but keyed by DCQL
 * `credential_query_id` instead of PEX `descriptorId`.
 */
export interface DcqlChosenCredential {
    /** Matches `DcqlQuery.credentials[N].id` from the verifier's query. */
    credentialQueryId: string;
    /** Wire-shape credential (JWT-VC string, LD-VC object, or SD-JWT compact). */
    candidate: AdaptableCredential;
    /**
     * Optional per-claim consent frame, honored only when this entry
     * resolves to an SD-JWT-VC passthrough. Omitted = release every
     * disclosable claim (no selective disclosure).
     */
    disclose?: SdJwtDiscloseFrame;
}

export interface BuildDcqlPresentationsInput {
    /**
     * Parsed + validated DCQL query (the one the verifier sent). Used
     * to map `credentialQueryId` → declared format, validate that
     * every chosen entry references a known query id, and to detect
     * `multiple: true`.
     */
    query: DcqlQuery;

    /** Holder picks. At least one entry per query id MUST be present. */
    chosen: readonly DcqlChosenCredential[];

    /** Holder DID — emitted as `unsignedVp.holder` for VCDM §4.1.1 conformance. */
    holder: string;

    /**
     * Optional presentation id factory — used in tests for
     * deterministic UUIDs. Defaults to a crypto-random hex generator
     * mirroring `vp/present.ts`.
     */
    makeId?: () => string;
}

/**
 * Per-query build output. Discriminated by `kind`:
 *
 * - `vp` — verifiable presentation envelope (jwt_vp_json or ldp_vp).
 *   The signing layer wraps the chosen credentials in `unsignedVp` and
 *   produces a signed VP. This is the path for `jwt_vc_json` / `ldp_vc`
 *   inner formats.
 * - `sd-jwt-vc` — passthrough for `dc+sd-jwt` / `vc+sd-jwt` queries. The
 *   compact SD-JWT-VC IS the presentation per OID4VP §6.1.1; the
 *   signing layer asks `learnCard.invoke.presentSdJwtVc` to apply
 *   selective disclosure + KB-JWT and emits the resulting compact string
 *   as the `vp_token` value for this query id. DCQL's `multiple: true`
 *   is not yet implemented for SD-JWT (one compact per query id).
 */
export type BuiltDcqlPresentation = BuiltDcqlVpPresentation | BuiltDcqlSdJwtPresentation;

export interface BuiltDcqlVpPresentation {
    kind: 'vp';
    /** Matches `DcqlQuery.credentials[N].id`. */
    credentialQueryId: string;
    /** Unsigned VP wrapping the chosen credentials for this query. */
    unsignedVp: UnsignedVP;
    /** Envelope format the signing layer should use. */
    vpFormat: 'jwt_vp_json' | 'ldp_vp';
    /**
     * Original wire-shape candidates packed into this VP, in the
     * order they appear in `unsignedVp.verifiableCredential`. The
     * submission layer doesn't need this directly, but tests + the
     * future "what was actually presented?" inspection API do.
     */
    candidates: AdaptableCredential[];
}

export interface BuiltDcqlSdJwtPresentation {
    kind: 'sd-jwt-vc';
    /** Matches `DcqlQuery.credentials[N].id`. */
    credentialQueryId: string;
    /** Source compact SD-JWT-VC the holder chose. The signing layer feeds this into `presentSdJwtVc`. */
    compact: string;
    /** Format declared by the verifier on this query entry; passed back so the response can echo it. */
    vpFormat: 'dc+sd-jwt' | 'vc+sd-jwt';
    /** Original wire-shape candidates (always length-1 in this slice; `multiple: true` is a follow-up). */
    candidates: AdaptableCredential[];
    /** Per-claim consent frame from the holder UI, forwarded to the SD-JWT presenter at sign time. */
    disclose?: SdJwtDiscloseFrame;
}

/* -------------------------------------------------------------------------- */
/*                                  errors                                    */
/* -------------------------------------------------------------------------- */

export type BuildDcqlPresentationErrorCode =
    | 'no_selections'
    | 'unknown_credential_query'
    | 'unsupported_format'
    | 'invalid_jwt_vc'
    | 'invalid_sd_jwt_vc';

export class BuildDcqlPresentationError extends Error {
    readonly code: BuildDcqlPresentationErrorCode;

    constructor(code: BuildDcqlPresentationErrorCode, message: string) {
        super(message);
        this.name = 'BuildDcqlPresentationError';
        this.code = code;
    }
}

/* -------------------------------------------------------------------------- */
/*                              public surface                                */
/* -------------------------------------------------------------------------- */

/**
 * Build one unsigned VP per `credential_query_id` referenced in
 * `chosen`. The order of returned entries follows the DCQL query's
 * own `credentials[]` order, so the eventual `vp_token` object's key
 * insertion order matches verifier expectations (most verifiers
 * iterate query entries in declared order when validating).
 *
 * Throws `BuildDcqlPresentationError` on:
 *   - empty `chosen`
 *   - a chosen entry referencing an id NOT in `query.credentials[]`
 *   - a chosen entry whose query format is sd-jwt-vc / mso_mdoc
 *     (out-of-scope for this slice; tracked for later)
 *   - a `jwt_vc_json` candidate that's neither a compact JWS string
 *     nor an object with a string `proof.jwt` (matches the PEX
 *     builder's `invalid_jwt_vc` branch)
 */
export const buildDcqlPresentations = (
    input: BuildDcqlPresentationsInput
): BuiltDcqlPresentation[] => {
    const { query, chosen, holder } = input;

    if (chosen.length === 0) {
        throw new BuildDcqlPresentationError(
            'no_selections',
            'buildDcqlPresentations requires at least one chosen credential'
        );
    }

    const makeId = input.makeId ?? defaultMakeId;

    const groups = new Map<
        string,
        { candidates: AdaptableCredential[]; disclose?: SdJwtDiscloseFrame }
    >();
    for (const pick of chosen) {
        const existing = groups.get(pick.credentialQueryId);
        if (existing) {
            existing.candidates.push(pick.candidate);
            if (!existing.disclose && pick.disclose) existing.disclose = pick.disclose;
        } else {
            groups.set(pick.credentialQueryId, {
                candidates: [pick.candidate],
                disclose: pick.disclose,
            });
        }
    }

    // Index DCQL queries for fast id → format lookup. The dcql library
    // schema guarantees ids are unique within `credentials[]`, so a
    // plain Map is sufficient.
    const queryById = new Map<string, DcqlQuery['credentials'][number]>();
    for (const c of query.credentials) {
        queryById.set(c.id, c);
    }

    const out: BuiltDcqlPresentation[] = [];

    for (const queryEntry of query.credentials) {
        const group = groups.get(queryEntry.id);
        if (!group) continue;

        out.push(
            buildOnePresentation(queryEntry, group.candidates, holder, makeId, group.disclose)
        );

        groups.delete(queryEntry.id);
    }

    // Picks that referenced unknown ids — surface as a typed error.
    if (groups.size > 0) {
        const orphan = Array.from(groups.keys()).join(', ');
        throw new BuildDcqlPresentationError(
            'unknown_credential_query',
            `chosen credentials reference query ids the DCQL query doesn't declare: ${orphan}`
        );
    }

    return out;
};

/* -------------------------------------------------------------------------- */
/*                                  internals                                 */
/* -------------------------------------------------------------------------- */

const buildOnePresentation = (
    queryEntry: DcqlQuery['credentials'][number],
    candidates: AdaptableCredential[],
    holder: string,
    makeId: () => string,
    disclose?: SdJwtDiscloseFrame
): BuiltDcqlPresentation => {
    if (queryEntry.format === 'dc+sd-jwt' || queryEntry.format === 'vc+sd-jwt') {
        return buildSdJwtPassthrough(queryEntry, candidates, disclose);
    }

    const vpFormat = vpFormatForQueryFormat(queryEntry.format, queryEntry.id);

    const innerCredentials = candidates.map((candidate, i) =>
        normalizeForEmbedding(candidate, queryEntry.id, i)
    );

    const unsignedVp: UnsignedVP = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: `urn:uuid:${makeUuidV4(makeId)}`,
        type: ['VerifiablePresentation'],
        holder,
        verifiableCredential: innerCredentials as UnsignedVP['verifiableCredential'],
    };

    return {
        kind: 'vp',
        credentialQueryId: queryEntry.id,
        unsignedVp,
        vpFormat,
        candidates,
    };
};

const buildSdJwtPassthrough = (
    queryEntry: DcqlQuery['credentials'][number],
    candidates: AdaptableCredential[],
    disclose?: SdJwtDiscloseFrame
): BuiltDcqlSdJwtPresentation => {
    if (candidates.length !== 1) {
        throw new BuildDcqlPresentationError(
            'invalid_sd_jwt_vc',
            `DCQL query "${queryEntry.id}" (format=${queryEntry.format}) received ${candidates.length} candidates; SD-JWT-VC passthrough currently supports exactly one candidate per query id (DCQL multiple:true for SD-JWT is a follow-up)`
        );
    }

    const compact = extractSdJwtCompact(candidates[0]!);
    if (!compact) {
        throw new BuildDcqlPresentationError(
            'invalid_sd_jwt_vc',
            `DCQL query "${queryEntry.id}" (format=${queryEntry.format}) candidate is not a recognizable SD-JWT-VC compact form (expected a string or a W3C-wrapped object with proof.jwt of shape "<header>.<payload>.<sig>~<disclosure>*~<kb>?")`
        );
    }

    return {
        kind: 'sd-jwt-vc',
        credentialQueryId: queryEntry.id,
        compact,
        vpFormat: queryEntry.format as 'dc+sd-jwt' | 'vc+sd-jwt',
        candidates,
        ...(disclose ? { disclose } : {}),
    };
};

const extractSdJwtCompact = (candidate: AdaptableCredential): string | undefined => {
    const cred = candidate.credential;

    if (typeof cred === 'string') {
        return looksLikeSdJwtCompact(cred) ? cred : undefined;
    }

    if (cred && typeof cred === 'object') {
        const proof = (cred as { proof?: unknown }).proof;
        const proofs = Array.isArray(proof) ? proof : proof ? [proof] : [];
        for (const proofObj of proofs) {
            if (!proofObj || typeof proofObj !== 'object') continue;
            const jwt = (proofObj as { jwt?: unknown }).jwt;
            if (typeof jwt === 'string' && looksLikeSdJwtCompact(jwt)) return jwt;
        }
    }

    return undefined;
};

const looksLikeSdJwtCompact = (s: string): boolean =>
    s.includes('~') && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+~/.test(s);

const vpFormatForQueryFormat = (format: string, queryId: string): 'jwt_vp_json' | 'ldp_vp' => {
    if (format === 'jwt_vc_json') return 'jwt_vp_json';
    if (format === 'ldp_vc') return 'ldp_vp';

    throw new BuildDcqlPresentationError(
        'unsupported_format',
        `DCQL query "${queryId}" requests format "${format}", which the plugin doesn't yet build presentations for (mso_mdoc is tracked for a follow-up slice)`
    );
};

/**
 * Mirrors `vp/present.ts:normalizeForEmbedding` — extract the on-the-
 * wire form a JWT-VC should be embedded as inside a VP. Duplicated
 * intentionally: this file is the DCQL pipeline, and the PEX file is
 * the PEX pipeline. Sharing would couple them through a third module
 * that the typing wouldn't help us prove either side actually
 * consumes correctly.
 */
const normalizeForEmbedding = (
    candidate: AdaptableCredential,
    queryId: string,
    index: number
): unknown => {
    const cred = candidate.credential;

    if (typeof cred === 'string') {
        if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(cred)) {
            return cred;
        }
        throw new BuildDcqlPresentationError(
            'invalid_jwt_vc',
            `chosen candidate at index ${index} for query "${queryId}" is a string but not a compact JWS`
        );
    }

    if (cred && typeof cred === 'object') {
        const proof = (cred as { proof?: unknown }).proof;
        // Legacy LDP-around-JWT envelope: pull the inner JWS string out.
        if (proof && typeof proof === 'object') {
            const jwt = (proof as { jwt?: unknown }).jwt;
            if (typeof jwt === 'string') return jwt;
        }
        // Plain LD-VC object — embed verbatim.
        return cred;
    }

    throw new BuildDcqlPresentationError(
        'invalid_jwt_vc',
        `chosen candidate at index ${index} for query "${queryId}" is neither a JWT string nor a JSON object`
    );
};

const defaultMakeId = (): string => {
    const cryptoObj: { getRandomValues?: (a: Uint8Array) => Uint8Array } | undefined =
        typeof globalThis !== 'undefined' && 'crypto' in globalThis
            ? (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } })
                  .crypto
            : undefined;

    if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
        const bytes = new Uint8Array(8);
        cryptoObj.getRandomValues(bytes);
        return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    }

    return Math.random().toString(36).slice(2, 18);
};

const makeUuidV4 = (makeId: () => string): string => {
    const hex = makeId().replace(/[^0-9a-f]/gi, '');
    const padded = (hex + '0'.repeat(32)).slice(0, 32);
    return [
        padded.slice(0, 8),
        padded.slice(8, 12),
        '4' + padded.slice(13, 16),
        ((parseInt(padded.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + padded.slice(17, 20),
        padded.slice(20, 32),
    ].join('-');
};
