/**
 * Playground HTTP API \u2014 mounted into Vite's dev server by the
 * `playgroundApiPlugin` in `./middleware.ts`.
 *
 * Two endpoints back the entire UI:
 *
 *   POST /api/launch
 *     Body: { providerId: 'waltid', scenarioId: 'vci-pre-auth-no-pin' }
 *     200:  { uri, deepLink, kind: 'vci'|'vp', state?, label, scenarioId }
 *
 *   GET  /api/status?providerId=waltid&kind=vp&state=<state>
 *     200:  { status: 'pending'|'success'|'fail', detail?: string }
 *
 * The endpoint catalogue intentionally hides walt.id's admin API
 * shape from the browser \u2014 the browser only knows about
 * (provider, scenario) pairs. Adding sphereon as a second provider
 * is one new branch in the dispatcher inside this file.
 */
import {
    createIssuerKey,
    createWaltidVerifySession,
    getWaltidVerifyStatus,
    mintWaltidOffer,
    resolveAuthorizationRequestToByValue,
    resolveOfferToByValue,
    type CreateVerifySessionOptions,
    type MintOfferOptions,
} from './waltid';

/** Resolved on import; lets every endpoint share an env baseline. */
const ISSUER_BASE_URL = process.env.WALTID_ISSUER_BASE_URL ?? 'http://localhost:7002';
const VERIFIER_BASE_URL = process.env.WALTID_VERIFIER_BASE_URL ?? 'http://localhost:7003';

/* -------------------------------------------------------------------------- */
/*                          provider \u00d7 scenario catalogue                     */
/* -------------------------------------------------------------------------- */

/**
 * Implementation block per scenario. Two flavors: VCI scenarios mint
 * a credential offer; VP scenarios spin up a verify session and
 * return the auth-request URI. Both end up the same shape on the
 * wire (a deep link the wallet handles).
 */
type LaunchResult =
    | {
          kind: 'vci';
          uri: string;
          deepLink: string;
          label: string;
          scenarioId: string;
      }
    | {
          kind: 'vp';
          uri: string;
          deepLink: string;
          state: string;
          label: string;
          scenarioId: string;
      };

interface VciImpl {
    kind: 'vci';
    label: string;
    run: () => Promise<{ rawOfferUri: string }>;
}

interface VpImpl {
    kind: 'vp';
    label: string;
    run: () => Promise<{ rawAuthRequestUri: string; state: string }>;
}

/**
 * Scenario implementations keyed by `<providerId>:<scenarioId>`.
 * Adding a new scenario \u2192 one entry here + one entry in
 * `src/scenarios/` so the UI knows about it. Adding a new provider
 * \u2192 fill in more entries with a different prefix.
 */
const IMPLS: Record<string, VciImpl | VpImpl> = {
    /* ----------------------------- VCI \u2014 walt.id ---------------------------- */

    'waltid:vci-pre-auth-no-pin': {
        kind: 'vci',
        label: 'Pre-auth offer (no PIN) \u2014 walt.id',
        run: async () => {
            const issuerKey = await createIssuerKey();
            const rawOfferUri = await mintWaltidOffer({
                issuerBaseUrl: ISSUER_BASE_URL,
                issuerKey,
                authenticationMethod: 'PRE_AUTHORIZED',
            });
            return { rawOfferUri };
        },
    },

    'waltid:vci-pre-auth-pin': {
        kind: 'vci',
        label: 'Pre-auth offer with PIN \u2014 walt.id',
        run: async () => {
            const issuerKey = await createIssuerKey();
            const rawOfferUri = await mintWaltidOffer({
                issuerBaseUrl: ISSUER_BASE_URL,
                issuerKey,
                authenticationMethod: 'PRE_AUTHORIZED',
                // Surfaced to the UI alongside the QR \u2014 the dev
                // types this into the LCA wallet's PIN modal.
                txCode: '1234',
            } satisfies MintOfferOptions);
            return { rawOfferUri };
        },
    },

    'waltid:vci-auth-code': {
        kind: 'vci',
        label: 'Authorization code flow \u2014 walt.id',
        run: async () => {
            const issuerKey = await createIssuerKey();
            const rawOfferUri = await mintWaltidOffer({
                issuerBaseUrl: ISSUER_BASE_URL,
                issuerKey,
                // `NONE` triggers walt.id's auth-code grant variant
                // (the AS auto-issues without challenging the user)
                // so the wallet's auth-code path runs end-to-end.
                authenticationMethod: 'NONE',
            });
            return { rawOfferUri };
        },
    },

    /* ----------------------------- VP \u2014 walt.id ----------------------------- */

    'waltid:vp-pex-single': {
        kind: 'vp',
        label: 'PEX, single descriptor \u2014 walt.id',
        run: async () => {
            const session = await createWaltidVerifySession({
                verifierBaseUrl: VERIFIER_BASE_URL,
                requestCredentials: [
                    { type: 'UniversityDegree', format: 'jwt_vc_json' },
                ],
            });
            return {
                rawAuthRequestUri: session.authorizationRequestUri,
                state: session.state,
            };
        },
    },

    'waltid:vp-pex-multi-candidate': {
        kind: 'vp',
        label: 'PEX, multi-candidate (picker) \u2014 walt.id',
        run: async () => {
            // Same descriptor, but the holder will likely have multiple
            // UniversityDegree VCs (issued via the VCI scenarios) and
            // the wallet's picker should appear on the consent screen.
            const session = await createWaltidVerifySession({
                verifierBaseUrl: VERIFIER_BASE_URL,
                requestCredentials: [
                    { type: 'UniversityDegree', format: 'jwt_vc_json' },
                ],
            });
            return {
                rawAuthRequestUri: session.authorizationRequestUri,
                state: session.state,
            };
        },
    },

    'waltid:vp-jarm': {
        kind: 'vp',
        label: 'JARM (encrypted response) \u2014 walt.id',
        run: async () => {
            const session = await createWaltidVerifySession({
                verifierBaseUrl: VERIFIER_BASE_URL,
                requestCredentials: [
                    { type: 'UniversityDegree', format: 'jwt_vc_json' },
                ],
                responseMode: 'direct_post.jwt',
            } satisfies CreateVerifySessionOptions);
            return {
                rawAuthRequestUri: session.authorizationRequestUri,
                state: session.state,
            };
        },
    },
};

/* -------------------------------------------------------------------------- */
/*                              endpoint handlers                             */
/* -------------------------------------------------------------------------- */

export interface LaunchRequestBody {
    providerId: string;
    scenarioId: string;
}

export const handleLaunch = async (
    body: LaunchRequestBody
): Promise<LaunchResult> => {
    const key = `${body.providerId}:${body.scenarioId}`;
    const impl = IMPLS[key];

    if (!impl) {
        throw new ApiError(
            404,
            `No implementation for provider="${body.providerId}", scenario="${body.scenarioId}"`
        );
    }

    if (impl.kind === 'vci') {
        const { rawOfferUri } = await impl.run();
        // Resolve to by-value so the wallet's https-only guard on
        // `credential_offer_uri` doesn't reject the local Docker URL.
        const uri = await resolveOfferToByValue(rawOfferUri);
        return {
            kind: 'vci',
            uri,
            deepLink: uri,
            label: impl.label,
            scenarioId: body.scenarioId,
        };
    }

    const { rawAuthRequestUri, state } = await impl.run();
    const uri = await resolveAuthorizationRequestToByValue(rawAuthRequestUri);
    return {
        kind: 'vp',
        uri,
        deepLink: uri,
        state,
        label: impl.label,
        scenarioId: body.scenarioId,
    };
};

export interface StatusQuery {
    providerId: string;
    kind: 'vci' | 'vp';
    state?: string;
}

export interface StatusResult {
    status: 'pending' | 'success' | 'fail';
    detail?: string;
}

/**
 * Provider-specific status polling. VCI scenarios are technically
 * "fire-and-forget" once the offer is minted (the wallet drives the
 * whole exchange), so we report `pending` indefinitely \u2014 the dev
 * confirms success by watching the wallet UI. VP scenarios poll the
 * verifier's session endpoint until the result flips to a boolean.
 */
export const handleStatus = async (q: StatusQuery): Promise<StatusResult> => {
    if (q.kind === 'vci') {
        return {
            status: 'pending',
            detail: 'walt.id does not expose a per-offer redemption status \u2014 watch the wallet for completion.',
        };
    }

    if (!q.state) {
        throw new ApiError(400, 'VP status query requires `state`');
    }

    if (q.providerId !== 'waltid') {
        throw new ApiError(
            400,
            `VP status polling is only implemented for providerId="waltid" (got "${q.providerId}")`
        );
    }

    const status = await getWaltidVerifyStatus(VERIFIER_BASE_URL, q.state);
    if (status.verificationResult === true) {
        return { status: 'success' };
    }
    if (status.verificationResult === false) {
        return { status: 'fail', detail: 'walt.id verifier rejected the presentation.' };
    }
    return { status: 'pending' };
};

/* -------------------------------------------------------------------------- */
/*                                 utilities                                  */
/* -------------------------------------------------------------------------- */

export class ApiError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
    }
}
