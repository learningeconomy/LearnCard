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
    vp?: { holder?: unknown } | null;
};

type DelegateJwtHeader = { kid?: unknown };

const verifyDelegatePresentation = async (
    jwt: string,
    payload: DelegateJwtPayload,
    challenge: string
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
 * exactly this `challenge` and this single `audience`.
 *
 * It says nothing about any stored grant: whether the challenge names a grant, whether
 * that grant belongs to this signer and audience, is unexpired, unrevoked or in scope is
 * for `evaluateDelegateAuthGrant` to decide. Nothing is read, cached or written here.
 */
export const readDelegatePresentation = async (
    jwt: string
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
            presentation: await verifyDelegatePresentation(jwt, payload, challenge),
        };
    } catch {
        return { isDelegateToken: true, presentation: undefined };
    }
};
