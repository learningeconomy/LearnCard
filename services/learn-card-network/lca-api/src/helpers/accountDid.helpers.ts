import { decodeProtectedHeader } from 'jose';

import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { findUserKeyByDid } from '../models/UserKey';

/** Multibase (base58btc) prefix of an Ed25519 public key: `z` + multicodec 0xed01. */
const ED25519_MULTIBASE = /^z6Mk[1-9A-HJ-NP-Za-km-z]{44}$/;

type VerificationMethodLike = { id?: unknown; publicKeyMultibase?: unknown };

const ownerMethodIds = (did: string): string[] => [`${did}#owner`, '#owner'];

const getSigningKid = (authorizationHeader?: string): string | undefined => {
    const [scheme, jwt] = authorizationHeader?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !jwt) return undefined;
    try {
        const { kid } = decodeProtectedHeader(jwt);
        return typeof kid === 'string' ? kid : undefined;
    } catch {
        return undefined;
    }
};

/**
 * The did:key of the key that signed this request as a profile did:web, or undefined.
 *
 * Only for a presentation signed with the did:web's own `#owner` key. The request context
 * has already verified that signature against the did:web document, so the did:key built
 * from that same Ed25519 public key is controlled by the signer. Keys added to the document
 * by others (e.g. signing authorities) are never used.
 */
export const getOwnerKeyDid = async (
    did: string,
    authorizationHeader?: string
): Promise<string | undefined> => {
    if (!did.startsWith('did:web:')) return undefined;
    if (getSigningKid(authorizationHeader) !== `${did}#owner`) return undefined;
    try {
        const learnCard = await getEmptyLearnCard();
        const document = (await learnCard.invoke.resolveDid(did)) as {
            verificationMethod?: VerificationMethodLike[];
        };
        const owner = document.verificationMethod?.find(
            method => typeof method.id === 'string' && ownerMethodIds(did).includes(method.id)
        );
        const multibase = owner?.publicKeyMultibase;
        if (typeof multibase !== 'string' || !ED25519_MULTIBASE.test(multibase)) return undefined;
        return `did:key:${multibase}`;
    } catch {
        return undefined;
    }
};

/**
 * The DID an authenticated request's account is recorded under.
 *
 * Accounts are recorded under the wallet's did:key, but the app signs requests as its
 * network profile did:web once it has one. When no account matches the requesting DID, a
 * profile did:web signed with its `#owner` key resolves to that key's did:key.
 */
export const resolveAccountDid = async (
    did: string,
    authorizationHeader?: string
): Promise<string> => {
    if (!did.startsWith('did:web:') || (await findUserKeyByDid(did))) return did;
    const keyDid = await getOwnerKeyDid(did, authorizationHeader);
    if (keyDid && (await findUserKeyByDid(keyDid))) return keyDid;
    return did;
};
