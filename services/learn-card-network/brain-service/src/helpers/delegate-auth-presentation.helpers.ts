import jwtDecode from 'jwt-decode';

import {
    DELEGATE_GRANT_CHALLENGE_PREFIX,
    DelegateAuthGrantValidator,
} from './delegate-auth-grant.schema';
import { getEmptyLearnCard } from './learnCard.helpers';

/** Field names are those of the request `evaluateDelegateAuthGrant` compares with a grant. */
export type DelegatePresentation = {
    signerDid: string;
    issuerDid: string;
    holderDid: string;
    audience: string;
    challenge: string;
};

export type DelegatePresentationResult =
    { isDelegateToken: false } | { isDelegateToken: true; presentation?: DelegatePresentation };

// Claims of an unverified token: nothing about their types can be assumed.
type DelegateJwtPayload = {
    iss?: unknown;
    nonce?: unknown;
    aud?: unknown;
    vp?: { holder?: unknown; validUntil?: unknown } | null;
};

type DelegateJwtHeader = { kid?: unknown };

/** The furthest ahead of the server's clock a delegate token's `vp.validUntil` may be. */
export const DELEGATE_TOKEN_MAX_LIFETIME_MS = 5 * 60 * 1000;

/** Allowed on that upper bound only, for a signer whose clock runs ahead of the server's. */
export const DELEGATE_TOKEN_CLOCK_SKEW_MS = 30 * 1000;

// Exactly what `Date.prototype.toISOString()` writes: one form, UTC, no offset to interpret.
const DELEGATE_TOKEN_VALID_UNTIL_FORMAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const verifyDelegatePresentation = async (
    jwt: string,
    payload: DelegateJwtPayload,
    challenge: string,
    now: number
): Promise<DelegatePresentation | undefined> => {
    const { iss, aud, vp } = payload;

    // The rule a stored grant's `delegateDid` obeys: a delegate is a key, never a mutable alias.
    if (
        typeof iss !== 'string' ||
        !DelegateAuthGrantValidator.shape.delegateDid.safeParse(iss).success
    ) {
        return undefined;
    }

    // DIDKit binds iss to the verified signer, but does not bind the nested vp.holder.
    const holderDid = vp?.holder;

    if (holderDid !== iss) return undefined;

    // The key named in the header must be the issuer's own (`<did>#<fragment>`).
    const { kid } = jwtDecode<DelegateJwtHeader>(jwt, { header: true });

    if (typeof kid !== 'string' || kid.split('#')[0] !== iss) return undefined;

    // A delegate's signer writes one audience as a plain string. A list, even of one, is
    // refused: the policy compares a single audience and must not have to choose one.
    if (typeof aud !== 'string' || !aud) return undefined;

    // The SDK's presentation JWT carries no `exp`, `iat` or `nbf`, so the time bound is a date
    // inside the signed presentation, which the signature check below covers. A request is
    // accepted only during the last `DELEGATE_TOKEN_MAX_LIFETIME_MS` (plus
    // `DELEGATE_TOKEN_CLOCK_SKEW_MS`) before its `validUntil`. The signer chooses `validUntil`,
    // so this bounds how long a captured request stays usable after it first becomes
    // acceptable, not how long after signing: a far-future `validUntil` is refused now and
    // accepted during that last window before it.
    const validUntil = vp?.validUntil;

    if (typeof validUntil !== 'string' || !DELEGATE_TOKEN_VALID_UNTIL_FORMAT.test(validUntil)) {
        return undefined;
    }

    const until = Date.parse(validUntil);

    if (
        !Number.isFinite(until) ||
        until <= now ||
        until > now + DELEGATE_TOKEN_MAX_LIFETIME_MS + DELEGATE_TOKEN_CLOCK_SKEW_MS
    ) {
        return undefined;
    }

    const learnCard = await getEmptyLearnCard();

    const result = await learnCard.invoke.verifyPresentation(jwt, {
        proofFormat: 'jwt',
        challenge,
        domain: aud,
    });

    // Fail closed on verifier warnings, as the credential-refresh verifier does.
    if (
        result.warnings.length !== 0 ||
        result.errors.length !== 0 ||
        !result.checks.includes('JWS')
    ) {
        return undefined;
    }

    return { signerDid: iss, issuerDid: iss, holderDid, audience: aud, challenge };
};

/**
 * Reads a bearer JWT as a delegate's DID-auth presentation. Never throws.
 *
 * A returned `presentation` guarantees that the token was signed by the `did:key` in
 * `signerDid`, that issuer and holder are that same DID, and that the signature covers
 * exactly this `challenge` and this single `audience`. It also guarantees that the signed
 * `vp.validUntil` is later than `now` and at most `DELEGATE_TOKEN_MAX_LIFETIME_MS` (plus
 * `DELEGATE_TOKEN_CLOCK_SKEW_MS`) ahead of it. That does NOT make a token one-use: until
 * its bound passes, the same token is accepted again. Nor does it bound how long after
 * signing a token is accepted: the signer chooses `validUntil`, and a token is accepted
 * only during that last window before it, whenever it was signed.
 *
 * It says nothing about any stored grant: whether the challenge names a grant, whether
 * that grant belongs to this signer and audience, is unexpired, unrevoked or in scope is
 * for `evaluateDelegateAuthGrant` to decide. Nothing is read, cached or written here.
 */
export const readDelegatePresentation = async (
    jwt: string,
    now: number = Date.now()
): Promise<DelegatePresentationResult> => {
    let payload: DelegateJwtPayload;
    let challenge: unknown;

    try {
        payload = jwtDecode<DelegateJwtPayload>(jwt);
        challenge = payload.nonce;
    } catch {
        return { isDelegateToken: false };
    }

    // Decided from the unverified payload on purpose: a token that carries the delegate
    // prefix is handled by the delegate path only, whether or not it verifies, so the
    // caller needs this answer for an invalid token too.
    if (typeof challenge !== 'string' || !challenge.startsWith(DELEGATE_GRANT_CHALLENGE_PREFIX)) {
        return { isDelegateToken: false };
    }

    try {
        return {
            isDelegateToken: true,
            presentation: await verifyDelegatePresentation(jwt, payload, challenge, now),
        };
    } catch {
        return { isDelegateToken: true, presentation: undefined };
    }
};
