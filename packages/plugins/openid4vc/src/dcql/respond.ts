/**
 * Sign the per-query unsigned VPs from `./build.ts` and assemble the
 * OID4VP §6.4 DCQL `vp_token` object.
 *
 * # Why this is a separate module from `./build.ts`
 *
 * `./build.ts` is pure / synchronous (just data shaping). Signing
 * touches keys, can be async, and routes through the LearnCard host's
 * crypto plumbing (Ed25519 JWT signer for `jwt_vp_json`,
 * `learnCard.invoke.issuePresentation` for `ldp_vp`). Keeping signing
 * isolated lets tests exercise build without keys, and lets the
 * eventual plugin-level routing call `buildDcqlPresentations →
 * signDcqlPresentations → submitDcqlPresentation` as separate phases.
 *
 * # Wire shape produced
 *
 * Per OID4VP 1.0 §6.4 Wallet response with DCQL:
 *
 * ```jsonc
 * {
 *   "vp_token": {
 *     "<credentialQueryId>": "<JWT-VP compact JWS>",   // jwt_vp_json
 *     "<credentialQueryId>": { ...VP json... },        // ldp_vp
 *     // ...one entry per `DcqlQuery.credentials[].id` the wallet
 *     // chose to fulfill
 *   },
 *   "state": "<request.state>"
 *   // No `presentation_submission` — DCQL keys carry the routing.
 * }
 * ```
 *
 * Submission to `response_uri` happens in the next slice via an
 * extension to `vp/submit.ts` that takes an object-form `vp_token`.
 */
import {
    signPresentation,
    type LdpVpSigner,
} from '../vp/sign';
import type { ProofJwtSigner } from '../vci/types';

import type { BuiltDcqlPresentation } from './build';

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

export interface SignDcqlPresentationsInput {
    /** Output of `buildDcqlPresentations(...)`. */
    built: readonly BuiltDcqlPresentation[];
    /** Audience for every signed VP — typically `request.client_id`. */
    audience: string;
    /** Nonce for every signed VP — `request.nonce` from the auth request. */
    nonce: string;
    /** Holder DID for every VP. */
    holder: string;
    /** Optional fixed `iat` (test determinism). Defaults to `now`. */
    iat?: number;
}

export interface SignDcqlPresentationsHelpers {
    /** Required when any `built[].vpFormat === 'jwt_vp_json'`. */
    jwtSigner?: ProofJwtSigner;
    /** Required when any `built[].vpFormat === 'ldp_vp'`. */
    ldpVpSigner?: LdpVpSigner;
}

/**
 * One signed presentation in a DCQL response. The value type is the
 * inner-VP shape (`string` for jwt_vp_json, `VP` for ldp_vp) — not
 * the full {@link VpToken} union, because DCQL responses never nest
 * (you can't have a DCQL object as a value inside another DCQL object).
 */
export type DcqlInnerVpToken = string | import('@learncard/types').VP;

export interface DcqlSignedPresentation {
    credentialQueryId: string;
    vpToken: DcqlInnerVpToken;
    vpFormat: BuiltDcqlPresentation['vpFormat'];
}

export interface DcqlResponse {
    /**
     * The OID4VP §6.4 `vp_token` object — keys are `credential_query_id`
     * strings, values are signed presentations. Submission code POSTs
     * this verbatim. Compatible with {@link VpToken}'s
     * `Record<string, string | VP>` arm.
     */
    vpToken: Record<string, DcqlInnerVpToken>;

    /**
     * Per-query signed-presentation breakdown. Same data as `vpToken`
     * but in array form so callers can iterate / inspect / log
     * without `Object.entries(...)` boilerplate.
     */
    presentations: DcqlSignedPresentation[];
}

/* -------------------------------------------------------------------------- */
/*                              public surface                                */
/* -------------------------------------------------------------------------- */

/**
 * Sign each unsigned VP from {@link buildDcqlPresentations} using the
 * appropriate signer (jwt for jwt_vp_json, ldp for ldp_vp), preserving
 * the per-query `credentialQueryId` association.
 *
 * Throws `VpSignError` (the same code path as PEX signing) on signer
 * misconfiguration; the per-query signing is sequential rather than
 * parallel both because Ed25519 signing is fast (sub-ms per VP) and
 * because some host signers maintain ordered nonce state.
 */
export const signDcqlPresentations = async (
    input: SignDcqlPresentationsInput,
    helpers: SignDcqlPresentationsHelpers
): Promise<DcqlSignedPresentation[]> => {
    const out: DcqlSignedPresentation[] = [];

    for (const entry of input.built) {
        const result = await signPresentation(
            {
                unsignedVp: entry.unsignedVp,
                vpFormat: entry.vpFormat,
                audience: input.audience,
                nonce: input.nonce,
                holder: input.holder,
                iat: input.iat,
            },
            helpers
        );

        // `result.vpToken` is the broad `VpToken` union. For DCQL
        // inner VPs we know the runtime shape can only be `string`
        // (jwt_vp_json compact JWS) or `VP` (signed ldp_vp object) —
        // a per-query DCQL inner can't itself be a DCQL Record. The
        // signPresentation contract enforces this; the cast is a
        // narrowing hint TypeScript can't infer from the union.
        out.push({
            credentialQueryId: entry.credentialQueryId,
            vpToken: result.vpToken as DcqlInnerVpToken,
            vpFormat: entry.vpFormat,
        });
    }

    return out;
};

/**
 * Convenience: combine signing + vp_token-object assembly. Use this
 * from plugin-level `presentCredentials` when the route is DCQL;
 * direct callers who want to inspect per-query signing details can
 * call `signDcqlPresentations` and then `assembleDcqlVpToken`
 * themselves.
 */
export const buildDcqlResponse = async (
    input: SignDcqlPresentationsInput,
    helpers: SignDcqlPresentationsHelpers
): Promise<DcqlResponse> => {
    const presentations = await signDcqlPresentations(input, helpers);
    return {
        vpToken: assembleDcqlVpToken(presentations),
        presentations,
    };
};

/**
 * Pure aggregator: per-query signed presentations → vp_token object.
 *
 * Object key order follows the input array order, which the build
 * layer guarantees mirrors the verifier's DCQL `credentials[]`
 * declaration order. Some verifiers iterate query entries in declared
 * order during validation, so this preserves that locality.
 *
 * `multiple: true` queries are not supported in this slice — each
 * query id maps to a single VP. When we add support, the value type
 * widens to `VpToken | VpToken[]`.
 */
export const assembleDcqlVpToken = (
    presentations: readonly DcqlSignedPresentation[]
): Record<string, DcqlInnerVpToken> => {
    const out: Record<string, DcqlInnerVpToken> = {};
    for (const p of presentations) {
        out[p.credentialQueryId] = p.vpToken;
    }
    return out;
};
