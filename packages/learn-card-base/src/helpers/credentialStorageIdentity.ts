import type { VC } from '@learncard/types';
import stringify from 'json-stringify-deterministic';

/**
 * Account-scoped identity of the entire signed payload for exact-save retries.
 * Credential IDs can be reused across revisions, so they are not retry keys.
 * Object keys are ordered only for hashing; the original credential is never
 * modified. Claims, proof bytes, array order and extension fields all contribute.
 */
export const getCredentialPayloadRecordId = async (
    credential: VC,
    accountDid: string
): Promise<string> => {
    const bytes = new TextEncoder().encode(stringify([accountDid, credential]));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join(
        ''
    );
    return `chapi:sha256:${hex}`;
};
