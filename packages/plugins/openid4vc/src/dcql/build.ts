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

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

/** Outer presentation envelope format produced for a DCQL response. */
export type DcqlVpFormat = 'jwt_vp_json' | 'ldp_vp';

/**
 * One holder pick: "this candidate satisfies this credential query."
 *
 * Direct analog of `vp/present.ts:ChosenCredential` but keyed by DCQL
 * `credential_query_id` instead of PEX `descriptorId`.
 */
export interface DcqlChosenCredential {
    /** Matches `DcqlQuery.credentials[N].id` from the verifier's query. */
    credentialQueryId: string;
    /** Wire-shape credential (JWT-VC string or LD-VC object). */
    candidate: AdaptableCredential;
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

/** One unsigned VP, ready for the signing layer. */
export interface BuiltDcqlPresentation {
    /** Matches `DcqlQuery.credentials[N].id`. */
    credentialQueryId: string;
    /** Unsigned VP wrapping the chosen credentials for this query. */
    unsignedVp: UnsignedVP;
    /** Envelope format the signing layer should use. */
    vpFormat: DcqlVpFormat;
    /**
     * Original wire-shape candidates packed into this VP, in the
     * order they appear in `unsignedVp.verifiableCredential`. The
     * submission layer doesn't need this directly, but tests + the
     * future "what was actually presented?" inspection API do.
     */
    candidates: AdaptableCredential[];
}

/* -------------------------------------------------------------------------- */
/*                                  errors                                    */
/* -------------------------------------------------------------------------- */

export type BuildDcqlPresentationErrorCode =
    | 'no_selections'
    | 'unknown_credential_query'
    | 'unsupported_format'
    | 'invalid_jwt_vc';

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

    // Group chosen entries by credential_query_id so each VP packs
    // exactly the candidates the verifier asked for under that id.
    const groups = new Map<string, AdaptableCredential[]>();
    for (const pick of chosen) {
        const existing = groups.get(pick.credentialQueryId);
        if (existing) {
            existing.push(pick.candidate);
        } else {
            groups.set(pick.credentialQueryId, [pick.candidate]);
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

    // Iterate the ORIGINAL query order so the final vp_token object
    // matches what verifiers iterate first.
    for (const queryEntry of query.credentials) {
        const candidates = groups.get(queryEntry.id);
        if (!candidates) continue; // No pick for this query — caller may have skipped optional ones.

        out.push(buildOnePresentation(queryEntry, candidates, holder, makeId));

        // Mark consumed so we can detect orphan picks below.
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
    makeId: () => string
): BuiltDcqlPresentation => {
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
        credentialQueryId: queryEntry.id,
        unsignedVp,
        vpFormat,
        candidates,
    };
};

/**
 * Pick the outer envelope format from the DCQL query entry's declared
 * inner format. Unlike PEX (where the verifier may declare a `format`
 * map allowing multiple options), DCQL queries pin exactly one format
 * per credentials[] entry, so this is a direct map.
 */
const vpFormatForQueryFormat = (
    format: string,
    queryId: string
): DcqlVpFormat => {
    if (format === 'jwt_vc_json') return 'jwt_vp_json';
    if (format === 'ldp_vc') return 'ldp_vp';

    throw new BuildDcqlPresentationError(
        'unsupported_format',
        `DCQL query "${queryId}" requests format "${format}", which the plugin doesn't yet build presentations for (sd-jwt-vc and mso_mdoc are tracked for follow-up slices)`
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
