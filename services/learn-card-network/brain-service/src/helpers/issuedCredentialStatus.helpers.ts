import { getBitstringStatusListEntries } from '@learncard/helpers';
import type { BitstringStatusListEntry, JWE, UnsignedVC } from '@learncard/types';

// Request-local sidecar: retain only public status-list coordinates from the unsigned
// SA request. Never decrypt the returned JWE to recover them. Weak keys prevent retention
// when issuance fails or a credential is returned without being stored on this server.
const issuedStatus = new WeakMap<JWE, BitstringStatusListEntry[]>();

export const rememberIssuedCredentialStatus = (jwe: JWE, unsigned: UnsignedVC): void => {
    issuedStatus.set(
        jwe,
        getBitstringStatusListEntries(unsigned).map(entry => ({
            id: entry.id,
            type: entry.type,
            statusPurpose: entry.statusPurpose,
            statusListIndex: entry.statusListIndex,
            statusListCredential: entry.statusListCredential,
        }))
    );
};

export const getIssuedCredentialStatus = (jwe: JWE): BitstringStatusListEntry[] | undefined =>
    issuedStatus.get(jwe);
