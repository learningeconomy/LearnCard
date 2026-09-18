import type { VC } from '@learncard/types';
import { stringify } from 'learn-card-base/helpers/jsonHelpers';

const sha256 = async (value: string): Promise<string> => {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);

    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Returns a stable endorsement target for a signed credential.
 *
 * W3C credential IDs are optional. For an idless credential, the target is a
 * content-addressed URN derived from the credential exactly as it is shared.
 */
export const resolveEndorsementTargetCredential = async (credential: VC): Promise<VC> => {
    if (credential.id) return credential;

    const sharedCredential = { ...credential } as VC & { boostID?: unknown };
    delete sharedCredential.boostID;

    const contentId = `urn:sha256:${await sha256(stringify(sharedCredential))}`;

    return { ...sharedCredential, id: contentId };
};
